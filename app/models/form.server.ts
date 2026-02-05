import { db } from '../db.server';
import type { Prisma } from '@prisma/client';

export async function createForm(shop: string, data: Prisma.FormCreateInput) {
  return db.form.create({ data: { ...data, shop } });
}

export async function getForms(shop: string) {
  return db.form.findMany({ where: { shop }, orderBy: { updatedAt: 'desc' } });
}

export async function getForm(shop: string, id: string) {
  return db.form.findFirst({ where: { shop, id } });
}

export async function updateForm(shop: string, id: string, data: Prisma.FormUpdateInput) {
  return db.form.update({ where: { id }, data });
}

export async function deleteForm(shop: string, id: string) {
  return db.form.delete({ where: { id } });
}

