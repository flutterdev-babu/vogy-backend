import { Router } from 'express';
import { generatePresignedUrl } from '../../controllers/upload/upload.controller';

const router = Router();

// Route to generate a presigned URL for secure frontend file uploads to Cloudflare R2
router.post('/presigned-url', generatePresignedUrl);

export default router;
