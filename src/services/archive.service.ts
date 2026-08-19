// src/services/archive.service.ts
import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { AppError } from '../errors/app-error';

const prisma = new PrismaClient();

export class ArchiveService {
  /**
   * Bundles all tax receipts for a given tax year into an organized ZIP with a summary CSV.
   */
  public async exportTaxYearZip(userId: string, taxYear: number): Promise<string> {
    const documents = await prisma.document.findMany({
      where: { userId, taxYear },
      orderBy: { documentDate: 'asc' },
    });

    if (documents.length === 0) {
      throw new AppError(`No tax documents found for tax year ${taxYear}.`, 404);
    }

    await fs.ensureDir(config.storage.localZipDir);
    const zipFilename = `ReceiptLens_TaxYear_${taxYear}_${userId.slice(0, 8)}.zip`;
    const zipPath = path.join(config.storage.localZipDir, zipFilename);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    // Generate CSV Manifest
    let csvContent = 'Document ID,Filename,Category,Merchant,Amount,Currency,Date,Source\n';

    for (const doc of documents) {
      if (await fs.pathExists(doc.storagePath)) {
        archive.file(doc.storagePath, { name: `receipts/${doc.fileName}` });
      }
      csvContent += `"${doc.id}","${doc.fileName}","${doc.category}","${doc.merchantName || 'N/A'}",${doc.totalAmount || 0},"${doc.currency}","${doc.documentDate ? doc.documentDate.toISOString().split('T')[0] : 'N/A'}","${doc.source}"\n`;
    }

    archive.append(csvContent, { name: `Tax_Summary_${taxYear}.csv` });
    await archive.finalize();

    return zipPath;
  }
}

export const archiveService = new ArchiveService();
