import { Router } from 'express';
import { generatePresignedUrl, deleteFile } from '../../controllers/upload/upload.controller';

const router = Router();

// Route to generate a presigned URL for secure frontend file uploads to Cloudflare R2
router.post('/presigned-url', generatePresignedUrl);

// Route to delete a file from Cloudflare R2 (e.g., when a user updates their profile picture)
router.post('/delete', deleteFile);

// Local fallback for PUT uploads in development
import { localPut } from '../../controllers/upload/upload.controller';
router.put('/local-put', localPut);

export default router;
