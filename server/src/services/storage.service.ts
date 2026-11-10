import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Buffer } from 'buffer';
import 'multer'; // Ensure Express.Multer namespace is loaded

// ─── Local storage setup ────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// The client (Vite dev server / static host) and the API run on different
// origins, so a relative "/uploads/..." URL resolves against the CLIENT's
// origin in the browser and 404s. Locally-stored files must be returned as
// absolute URLs pointing at this API server instead.
const SERVER_URL = (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

// ─── AWS S3 detection ───────────────────────────────────────────────────────
// We only load the S3 client if ALL four required env vars are present.
// This means the exact same code works locally (no AWS config) and in production.
const isS3Enabled =
  !!process.env.AWS_ACCESS_KEY_ID &&
  !!process.env.AWS_SECRET_ACCESS_KEY &&
  !!process.env.AWS_S3_BUCKET &&
  !!process.env.AWS_REGION;

// Lazy-import the S3 client to avoid any startup error when AWS packages
// are installed but credentials are not configured.
let s3Client: any = null;
let S3Upload: any = null;
let DeleteObjectCommand: any = null;

if (isS3Enabled) {
  // Dynamic require so tree-shaking/bundlers can skip this in dev builds
  const { S3Client, DeleteObjectCommand: DOC } = require('@aws-sdk/client-s3');
  const { Upload } = require('@aws-sdk/lib-storage');
  s3Client = new S3Client({ region: process.env.AWS_REGION });
  S3Upload = Upload;
  DeleteObjectCommand = DOC;
  console.log('✅ Storage: AWS S3 mode active (bucket:', process.env.AWS_S3_BUCKET, ')');
} else {
  console.log('ℹ️  Storage: Local disk mode active (set AWS_* env vars to switch to S3)');
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function generateKey(originalname: string): string {
  const uniqueSuffix = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalname);
  return `logos/${Date.now()}-${uniqueSuffix}${ext}`;
}

// ─── Service ────────────────────────────────────────────────────────────────
export const storageService = {
  /**
   * Returns true when AWS credentials are configured.
   * The admin routes use this to decide which multer storage engine to use.
   */
  get isS3Enabled() {
    return isS3Enabled;
  },

  /**
   * Uploads a logo file and returns its public URL.
   *
   * - S3 mode  → streams the buffer to S3, returns a public HTTPS URL.
   * - Local    → writes the buffer (or uses the already-saved disk file)
   *              and returns a relative /uploads/<filename> URL.
   */
  async uploadLogo(file: Express.Multer.File): Promise<string> {
    if (isS3Enabled) {
      // In S3 mode multer uses memoryStorage, so file.buffer is available.
      const key = generateKey(file.originalname);
      const upload = new S3Upload({
        client: s3Client,
        params: {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
      });
      await upload.done();
      return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    // Local mode: multer diskStorage already wrote the file to disk.
    // If for some reason the file has a buffer (memoryStorage fallback), write it.
    if (!file.filename && file.buffer) {
      const filename = generateKey(file.originalname).replace('logos/', '');
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), file.buffer);
      return `${SERVER_URL}/uploads/${filename}`;
    }

    return `${SERVER_URL}/uploads/${file.filename}`;
  },

  /**
   * Deletes a logo by its stored URL.
   *
   * - S3 mode  → extracts the S3 key from the HTTPS URL and sends a delete command.
   * - Local    → removes the file from the /uploads directory.
   */
  async deleteLogo(logoUrl: string): Promise<void> {
    try {
      if (isS3Enabled && logoUrl.startsWith('https://')) {
        // Extract S3 key: everything after the bucket hostname
        const url = new URL(logoUrl);
        const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        await s3Client.send(
          new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key })
        );
        return;
      }

      // Local fallback
      const filename = logoUrl.split('/').pop();
      if (filename) {
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to delete logo:', error);
    }
  },
  /**
   * Uploads a raw Buffer (e.g. a PDF) and returns its URL.
   * Used by report.service.ts after Puppeteer generates the PDF.
   */
  async uploadBuffer(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    if (isS3Enabled) {
      const key = `reports/${filename}`;
      const upload = new S3Upload({
        client: s3Client,
        params: {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        },
      });
      await upload.done();
      return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    // Local mode: save to uploads/reports/
    const reportsDir = path.join(UPLOADS_DIR, 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(path.join(reportsDir, filename), buffer);
    return `${SERVER_URL}/uploads/reports/${filename}`;
  },
};

