import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { shopify } from '~/shopify.server';
import { db } from '~/db.server';

export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop } = await shopify.authenticate.webhook(request);
  if (topic === 'APP_UNINSTALLED' && shop) {
    await db.session.deleteMany({ where: { shop } });
  }
  return json({ ok: true });
}
