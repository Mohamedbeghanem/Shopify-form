import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import crypto from 'node:crypto';
import { getAlgeriaLocations } from '~/utils/algeria.server';

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

  return json({ ok: true, locations: getAlgeriaLocations() });
}
