import { Request, Response } from 'express';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { s3Client } from '../../config/s3.config';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'text/csv'
];

export const generatePresignedUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, folder, fileSize } = req.body;

    // Basic validation
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    // Size validation, default to checking if it's over 10MB if provided
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    if (fileSize && Number(fileSize) > MAX_SIZE_BYTES) {
      return res.status(400).json({ error: 'File size exceeds the 10 MB limit' });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file type. Allowed types: Images, PDF, Word, Excel, CSV' });
    }

    // Prepare the final key
    const extension = path.extname(fileName);
    const uniqueId = uuidv4();
    const sanitizedFolder = folder ? `${folder}/` : 'misc/';
    const objectKey = `${sanitizedFolder}${uniqueId}${extension}`;

    // Cloudflare R2 bucket name
    const bucketName = process.env.R2_BUCKET_NAME;

    // FALLBACK: If R2 is not configured, use local storage
    if (!bucketName) {
      console.warn("⚠️ R2_BUCKET_NAME not set. Falling back to local storage for development.");
      const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');
      const localUploadUrl = `${apiBaseUrl}/upload/local-put?key=${encodeURIComponent(objectKey)}`;
      const finalPublicUrl = `${apiBaseUrl.replace('/api', '')}/uploads/${objectKey}`;

      return res.status(200).json({
        success: true,
        data: {
          presignedUrl: localUploadUrl,
          finalUrl: finalPublicUrl,
          objectKey,
        }
      });
    }

    // Create the command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: fileType,
    });

    // Generate the presigned URL
    // Valid for 15 minutes (900 seconds)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    // The final public URL where the file will be accessible after successful upload
    // Requires R2_PUBLIC_URL to be set in .env
    const publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';
    const finalUrl = `${publicBaseUrl}/${objectKey}`;

    return res.status(200).json({
      success: true,
      data: {
        presignedUrl,
        finalUrl,
        objectKey,
      }
    });

  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL', details: error.message });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ error: 'fileUrl is required' });
    }

    // The frontend might send the full URL. We need to extract just the objectKey.
    // E.g., https://your-public-url.com/profile_pictures/uuid.jpg -> profile_pictures/uuid.jpg
    const publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';
    
    let objectKey = fileUrl;
    
    // If the URL contains the base URL, strip it out to get the pure objectKey
    if (publicBaseUrl && fileUrl.startsWith(publicBaseUrl)) {
      objectKey = fileUrl.replace(`${publicBaseUrl}/`, '');
    } else if (fileUrl.startsWith('http')) {
      // Fallback: If it's a full URL but doesn't match publicBaseUrl, try extracting path
      const urlObj = new URL(fileUrl);
      // substring(1) removes the leading '/'
      objectKey = urlObj.pathname.substring(1);
    }

    // Cloudflare R2 bucket name
    const bucketName = process.env.R2_BUCKET_NAME || '';

    // Create the delete command
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    // Execute deletion using the existing s3Client
    await s3Client.send(command);

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      deletedKey: objectKey
    });

  } catch (error: any) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: 'Failed to delete file', details: error.message });
  }
};

/**
 * Fallback handler for local PUT uploads when R2 is not configured.
 * Saves the raw request body to the local 'uploads' directory.
 */
export const localPut = async (req: Request, res: Response) => {
  try {
    const { key } = req.query;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Key is required' });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, key);
    const dirPath = path.dirname(filePath);

    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write file
    const fileStream = fs.createWriteStream(filePath);
    req.pipe(fileStream);

    fileStream.on('finish', () => {
      res.status(200).json({ success: true, message: 'File uploaded locally' });
    });

    fileStream.on('error', (err) => {
      console.error('Local file write error:', err);
      res.status(500).json({ error: 'Failed to write file locally', details: err.message });
    });

  } catch (error: any) {
    console.error('Local upload error:', error);
    res.status(500).json({ error: 'Local upload failed', details: error.message });
  }
};
