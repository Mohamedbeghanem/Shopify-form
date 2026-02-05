import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import crypto from 'node:crypto';
import { trackEvent } from '../models/event.server';

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
    return json({ ok: false }, { status: 401 });
  }

  const { formId, type } = await request.json();
  const shop = url.searchParams.get('shop');
  if (!shop || !formId || !type) return json({ ok: false }, { status: 400 });
  await trackEvent(shop, formId, type);
  return json({ ok: true });
}

