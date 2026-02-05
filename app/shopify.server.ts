import { shopifyApp } from '@shopify/shopify-app-remix/server';
import { PrismaSessionStorage } from '@shopify/shopify-app-session-storage-prisma';
import { LATEST_API_VERSION, DeliveryMethod } from '@shopify/shopify-api';
import { db } from './db.server';

const sessionStorage = new PrismaSessionStorage(db);

export const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: (process.env.SCOPES || '').split(',').filter(Boolean),
  appUrl: process.env.SHOPIFY_APP_URL || '',
  apiVersion: LATEST_API_VERSION,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/api/webhooks'
    }
  },
  sessionStorage,
  distribution: 'AppStore',
  future: {
    unstable_newEmbeddedAuthStrategy: true
  }
});

export const authenticate = shopify.authenticate;

export async function ensureShopRecord(shop: string) {
  await db.shop.upsert({
    where: { shop },
    update: {},
    create: { shop }
  });
}
