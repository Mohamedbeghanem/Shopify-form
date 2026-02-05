import { db } from '../db.server';
import type { Prisma } from '@prisma/client';

export async function createSubmission(data: Prisma.SubmissionCreateInput) {
  return db.submission.create({ data });
}

export async function getSubmissions(shop: string, limit = 20) {
  return db.submission.findMany({
    where: { shop },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function countSubmissions(shop: string, days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return db.submission.count({ where: { shop, createdAt: { gte: since } } });
}

export async function countDraftOrders(shop: string, days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return db.submission.count({
    where: { shop, draftOrderId: { not: null }, createdAt: { gte: since } }
  });
}

