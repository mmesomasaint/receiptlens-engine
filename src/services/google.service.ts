// src/services/google.service.ts
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { config } from '../config';
import { encryptionService } from './encryption.service';
import { AppError } from '../errors/app-error';

export interface IngestibleAttachment {
  source: 'GMAIL' | 'GOOGLE_DRIVE';
  sourceId: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataBuffer: Buffer;
  checksum: string;
}

export class GoogleService {
  public getOAuthClient(): OAuth2Client {
    return new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }

  public getAuthenticatedClient(encryptedRefreshToken: string): OAuth2Client {
    const client = this.getOAuthClient();
    const refreshToken = encryptionService.decrypt(encryptedRefreshToken);
    client.setCredentials({ refresh_token: refreshToken });
    return client;
  }

  /**
   * Scans user's Gmail for tax documents, invoices, and receipts with supported attachments.
   */
  public async fetchGmailReceiptAttachments(
    auth: OAuth2Client,
    maxResults = 25
  ): Promise<IngestibleAttachment[]> {
    const gmail = google.gmail({ version: 'v1', auth });
    const query = 'has:attachment (filename:pdf OR filename:png OR filename:jpg OR filename:jpeg) (receipt OR invoice OR bill OR "w-9" OR "1099" OR statement)';

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });

    const messages = res.data.messages || [];
    const attachments: IngestibleAttachment[] = [];

    for (const msg of messages) {
      if (!msg.id) continue;
      const message = await gmail.users.messages.get({ userId: 'me', id: msg.id });
      const parts = message.data.payload?.parts || [];

      for (const part of parts) {
        if (
          part.filename &&
          part.body?.attachmentId &&
          /\.(pdf|png|jpg|jpeg)$/i.test(part.filename)
        ) {
          const attachRes = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: msg.id,
            id: part.body.attachmentId,
          });

          if (attachRes.data.data) {
            const buffer = Buffer.from(attachRes.data.data, 'base64');
            const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

            attachments.push({
              source: 'GMAIL',
              sourceId: `${msg.id}_${part.body.attachmentId}`,
              fileName: part.filename,
              mimeType: part.mimeType || 'application/octet-stream',
              size: buffer.length,
              dataBuffer: buffer,
              checksum,
            });
          }
        }
      }
    }

    return attachments;
  }

  /**
   * Scans Google Drive for uploaded invoices, tax documents, and receipts.
   */
  public async fetchDriveReceiptFiles(
    auth: OAuth2Client,
    pageSize = 25
  ): Promise<IngestibleAttachment[]> {
    const drive = google.drive({ version: 'v3', auth });
    const q = "trashed = false and (mimeType = 'application/pdf' or mimeType = 'image/png' or mimeType = 'image/jpeg') and (name contains 'receipt' or name contains 'invoice' or name contains 'tax' or name contains '1099' or name contains 'w9')";

    const res = await drive.files.list({
      q,
      fields: 'files(id, name, mimeType, size)',
      pageSize,
    });

    const files = res.data.files || [];
    const attachments: IngestibleAttachment[] = [];

    for (const file of files) {
      if (!file.id || !file.name) continue;

      const fileStream = await drive.files.get(
        { fileId: file.id, alt: 'media' },
        { responseType: 'arraybuffer' }
      );

      const buffer = Buffer.from(fileStream.data as ArrayBuffer);
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

      attachments.push({
        source: 'GOOGLE_DRIVE',
        sourceId: file.id,
        fileName: file.name,
        mimeType: file.mimeType || 'application/octet-stream',
        size: buffer.length,
        dataBuffer: buffer,
        checksum,
      });
    }

    return attachments;
  }
}

export const googleService = new GoogleService();
