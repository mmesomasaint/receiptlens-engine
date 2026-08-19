// src/schemas/document.schema.ts
import { z } from 'zod';
import { DocumentCategory } from '@prisma/client';

export const SearchDocumentSchema = z.object({
  query: z.object({
    q: z.string().max(200).optional(),
    taxYear: z
      .string()
      .regex(/^\d{4}$/, 'Tax year must be a 4-digit integer.')
      .transform(Number)
      .optional(),
    category: z.nativeEnum(DocumentCategory).optional(),
  }),
});
