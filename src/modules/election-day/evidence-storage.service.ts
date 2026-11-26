import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { access, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { Readable } from 'stream';

export type SavedEvidence = {
  relativePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

@Injectable()
export class EvidenceStorageService {
  private readonly uploadsRoot = join(process.cwd(), 'uploads', 'election-day');

  constructor() {
    if (!existsSync(this.uploadsRoot)) {
      mkdirSync(this.uploadsRoot, { recursive: true });
    }
  }

  async saveEvidenceFile(file: Express.Multer.File): Promise<SavedEvidence> {
    const extension = extname(file.originalname || '').toLowerCase() || '';
    const storedName = `${Date.now()}-${randomUUID()}${extension}`;
    const absolutePath = join(this.uploadsRoot, storedName);

    try {
      await writeFile(absolutePath, file.buffer);
    } catch {
      throw new InternalServerErrorException(
        'No se pudo guardar el archivo de evidencia',
      );
    }

    return {
      relativePath: join('election-day', storedName).replace(/\\/g, '/'),
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  getAbsolutePath(relativePath: string): string {
    return join(process.cwd(), 'uploads', relativePath);
  }

  async openEvidenceStream(relativePath: string): Promise<Readable> {
    const absolutePath = this.getAbsolutePath(relativePath);
    try {
      await access(absolutePath);
    } catch {
      throw new InternalServerErrorException(
        'El archivo de evidencia no está disponible',
      );
    }
    return createReadStream(absolutePath);
  }
}
