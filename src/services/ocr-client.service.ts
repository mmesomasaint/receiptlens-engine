// src/services/ocr-client.service.ts
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { config } from '../config';
import { AppError } from '../errors/app-error';

export interface ExtractedFeaturePayload {
  raw_text: string;
  merchant_name: string | null;
  total_amount: number | null;
  currency: string;
  document_date: string | null;
  tax_year: number | null;
  category: string;
  embedding: number[];
}

export class OcrClientService {
  public async extractDocument(filePath: string, originalFileName: string): Promise<ExtractedFeaturePayload> {
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath), originalFileName);

      const res = await axios.post(`${config.extractorServiceUrl}/extract`, form, {
        headers: form.getHeaders(),
        timeout: 60000,
      });

      return res.data;
    } catch (error: any) {
      throw new AppError(`OCR extraction microservice failure: ${error.message}`, 502);
    }
  }

  public async embedQuery(query: string): Promise<number[]> {
    try {
      const res = await axios.post(`${config.extractorServiceUrl}/embed-query`, { query });
      return res.data.embedding;
    } catch (error: any) {
      throw new AppError(`Query embedding failure: ${error.message}`, 502);
    }
  }
}

export const ocrClientService = new OcrClientService();
