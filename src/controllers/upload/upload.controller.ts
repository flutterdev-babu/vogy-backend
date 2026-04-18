import { Request, Response } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
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
    const bucketName = process.env.R2_BUCKET_NAME || '';

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
