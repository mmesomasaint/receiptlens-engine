import fs from 'fs-extra';
import path from 'path';
import { config } from '../config';
import { AppError } from '../errors/app-error';

export class StorageService {
  constructor() {
    fs.ensureDirSync(config.storage.localDocDir);
    fs.ensureDirSync(config.storage.localZipDir);
  }

  public async saveDocumentBuffer(userId: string, checksum: string, fileName: string, buffer: Buffer): Promise<string> {
    const safeFileName = `${userId}_${checksum}_${path.basename(fileName)}`;
    const fullPath = path.join(config.storage.localDocDir, safeFileName);
    await fs.writeFile(fullPath, buffer);
    return fullPath;
  }

  public async getFileStream(filePath: string): Promise<fs.ReadStream> {
    if (!(await fs.pathExists(filePath))) {
      throw new AppError('File artifact does not exist on storage disk.', 404);
    }
    return fs.createReadStream(filePath);
  }

  public async deleteFile(filePath: string): Promise<void> {
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  }
}

export const storageService = new StorageService();
