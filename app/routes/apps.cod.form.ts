import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import crypto from 'node:crypto';
import { db } from '~/db.server';

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

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const secret = process.env.SHOPIFY_API_SECRET || '';
  if (!verifyProxySignature(url.searchParams, secret)) {
    return json({ ok: false, message: 'Invalid signature' }, { status: 401 });
  }

  const shop = url.searchParams.get('shop');
  const slug = url.searchParams.get('slug');
  if (!shop || !slug) {
    return json({ ok: false, message: 'Missing params' }, { status: 400 });
  }

  const form = await db.form.findFirst({ where: { shop, slug, isActive: true } });
  if (!form) return json({ ok: false, message: 'Not found' }, { status: 404 });

  return json({
    ok: true,
    form: {
      id: form.id,
      name: form.name,
      slug: form.slug,
      settings: form.settings
    }
  });
}
