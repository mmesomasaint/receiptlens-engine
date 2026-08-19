// src/schemas/export.schema.ts
import { z } from 'zod';

export const ExportTaxYearSchema = z.object({
  params: z.object({
    taxYear: z
      .string()
      .regex(/^\d{4}$/, 'Tax year parameter must be a 4-digit number (e.g. 2025).')
      .transform(Number),
  }),
});

export const CreateCheckoutSessionSchema = z.object({
  body: z.object({
    plan: z.enum(['MONTHLY', 'ANNUAL'], {
      errorMap: () => ({ message: 'Plan must be either MONTHLY ($5/mo) or ANNUAL ($49/yr).' }),
    }),
    successUrl: z.string().url('A valid success return URL is required.'),
    cancelUrl: z.string().url('A valid cancellation URL is required.'),
  }),
});
