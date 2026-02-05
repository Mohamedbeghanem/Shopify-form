import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import crypto from 'node:crypto';
import { shopify } from '~/shopify.server';
import { db } from '~/db.server';
import { createSubmission } from '~/models/submission.server';
import { submitSchema } from '~/utils/validation';

function verifyProxySignature(params: URLSearchParams, secret: string) {
  const signature = params.get('signature') || '';
  const sorted = [...params.entries()]
    .filter(([key]) => key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('');

  const computed = crypto
    .createHmac('sha256', secret)
    .update(sorted)
    .digest('hex');

  if (signature.length !== computed.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const secret = process.env.SHOPIFY_API_SECRET || '';
  if (!verifyProxySignature(url.searchParams, secret)) {
    return json({ ok: false, message: 'Invalid signature' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, message: parsed.error.message }, { status: 400 });
  }

  const {
    formId,
    variantId,
    quantity,
    name,
    phone,
    wilaya,
    baladiya,
    address,
    notes,
    shippingOption,
    productPrice,
    deliveryPrice,
    discountAmount
  } = parsed.data;

  const shop = url.searchParams.get('shop');
  if (!shop) return json({ ok: false, message: 'Missing shop' }, { status: 400 });

  const session = await shopify.sessionStorage.findSessionsByShop(shop);
  const adminSession = session[0];
  if (!adminSession) {
    return json({ ok: false, message: 'App not installed' }, { status: 403 });
  }

  const client = new shopify.api.clients.Graphql({ session: adminSession });
  const form = await db.form.findFirst({ where: { shop, id: formId } });
  const formSettings = (form?.settings || {}) as any;
  const mutation = `
    mutation DraftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder { id name }
        userErrors { field message }
      }
    }
  `;

  const response = await client.query({
    data: {
      query: mutation,
      variables: {
        input: {
          lineItems: [
            {
              variantId: `gid://shopify/ProductVariant/${variantId}`,
              quantity
            }
          ],
          appliedDiscount:
            discountAmount > 0
              ? {
                  description: 'COD Discount',
                  title: 'Discount',
                  valueType: 'FIXED_AMOUNT',
                  value: discountAmount.toString()
                }
              : null,
          shippingLine: {
            title: shippingOption === 'express' ? 'Express' : 'Standard',
            price: deliveryPrice.toString()
          },
          tags: [
            'COD',
            'Algeria-COD',
            `Wilaya:${wilaya}`,
            `Baladiya:${baladiya}`
          ],
          noteAttributes: [
            { name: 'Full name', value: name },
            { name: 'Phone', value: phone },
            { name: 'Wilaya', value: wilaya },
            { name: 'Baladiya', value: baladiya },
            { name: 'Address', value: address },
            { name: 'Notes', value: notes || '' }
          ]
        }
      }
    }
  });

  const result = (response.body as any).data?.draftOrderCreate;
  const errors = result?.userErrors || [];
  if (errors.length > 0) {
    return json({ ok: false, message: errors[0].message }, { status: 400 });
  }

  const draftOrderId = result?.draftOrder?.id as string | undefined;

  const shouldComplete =
    formSettings.submitBehavior?.autoComplete ||
    formSettings.submitBehavior?.method === 'order';

  if (draftOrderId && shouldComplete) {
    const completeMutation = `
      mutation DraftOrderComplete($id: ID!) {
        draftOrderComplete(id: $id, paymentPending: true) {
          draftOrder { id name }
          userErrors { field message }
        }
      }
    `;
    await client.query({
      data: { query: completeMutation, variables: { id: draftOrderId } }
    });
  }

  const totalPrice = productPrice * quantity + deliveryPrice - discountAmount;

  await createSubmission({
    shop,
    formId,
    productVariantId: variantId,
    quantity,
    name,
    phone,
    wilaya,
    baladiya,
    address,
    notes: notes || null,
    shippingOption,
    productPrice,
    deliveryPrice,
    discountAmount,
    totalPrice,
    status: 'submitted',
    draftOrderId: draftOrderId || null
  });

  return json({ ok: true, message: 'success', draftOrderId });
}
