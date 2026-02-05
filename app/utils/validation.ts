import { z } from 'zod';

export const submitSchema = z.object({
  formId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
  name: z.string().min(2),
  phone: z.string().min(8),
  wilaya: z.string().min(1),
  baladiya: z.string().min(1),
  address: z.string().min(4),
  notes: z.string().optional().nullable(),
  shippingOption: z.enum(['standard', 'express']),
  productPrice: z.coerce.number().int().nonnegative(),
  deliveryPrice: z.coerce.number().int().nonnegative(),
  discountAmount: z.coerce.number().int().min(0),
  locale: z.string().optional()
});

export const formSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  isActive: z.boolean().default(true),
  settings: z.any()
});
