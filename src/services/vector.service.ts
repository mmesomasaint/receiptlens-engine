// src/services/vector.service.ts
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { config } from '../config';

const prisma = new PrismaClient();

export interface SearchFilters {
  userId: string;
  query?: string;
  taxYear?: number;
  category?: string;
  limitDays?: number; // 90 for free tier
}

export class VectorService {
  /**
   * Executes hybrid cosine similarity vector search and SQL metadata filtering on pgvector.
   */
  public async hybridSearch(filters: SearchFilters) {
    let dateFilterClause = '';
    if (filters.limitDays) {
      const cutoff = new Date(Date.now() - filters.limitDays * 24 * 60 * 60 * 1000).toISOString();
      dateFilterClause = `AND d."documentDate" >= '${cutoff}'::timestamp`;
    }

    let taxYearClause = '';
    if (filters.taxYear) {
      taxYearClause = `AND d."taxYear" = ${filters.taxYear}`;
    }

    let categoryClause = '';
    if (filters.category) {
      categoryClause = `AND d."category" = '${filters.category}'::"DocumentCategory"`;
    }

    if (filters.query && filters.query.trim()) {
      // 1. Fetch query embedding vector
      const embedRes = await axios.post(`${config.extractorServiceUrl}/embed-query`, {
        query: filters.query,
      });
      const queryVector = `[${embedRes.data.embedding.join(',')}]`;

      // 2. Perform Cosine Similarity Search using pgvector `<=>` operator
      const results: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          d."id", d."fileName", d."category", d."merchantName", d."totalAmount", 
          d."currency", d."documentDate", d."taxYear", d."storagePath",
          1 - (d."embedding" <=> '${queryVector}'::vector) AS "similarityScore"
        FROM "Document" d
        WHERE d."userId" = '${filters.userId}'
          ${dateFilterClause}
          ${taxYearClause}
          ${categoryClause}
        ORDER BY d."embedding" <=> '${queryVector}'::vector ASC
        LIMIT 50;
      `);

      return results;
    }

    // Default: Sort by document date descending if no semantic query provided
    const results: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        d."id", d."fileName", d."category", d."merchantName", d."totalAmount", 
        d."currency", d."documentDate", d."taxYear", d."storagePath",
        1.0 AS "similarityScore"
      FROM "Document" d
      WHERE d."userId" = '${filters.userId}'
        ${dateFilterClause}
        ${taxYearClause}
        ${categoryClause}
      ORDER BY d."documentDate" DESC NULLS LAST, d."createdAt" DESC
      LIMIT 50;
    `);

    return results;
  }
}

export const vectorService = new VectorService();
