import { db } from '../db.server';

export async function trackEvent(shop: string, formId: string, type: string) {
  return db.formEvent.create({ data: { shop, formId, type } });
}

export async function countEvents(shop: string, type: string, days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return db.formEvent.count({ where: { shop, type, createdAt: { gte: since } } });
}

