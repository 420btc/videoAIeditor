import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateThumbnail } from '../services/ffmpegService';

const router: Router = express.Router();

// Configure Multer for file uploads
const sourceVideosDir = path.join(__dirname, '..', '..', 'source_videos');
if (!fs.existsSync(sourceVideosDir)) {
  fs.mkdirSync(sourceVideosDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, sourceVideosDir); // Save uploaded videos to 'source_videos' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')); // Avoid spaces in filenames
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 500 }, // 500MB file size limit
  fileFilter: (req, file, cb) => {
    // Basic video file type validation
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// POST /api/edit/thumbnail
router.post('/thumbnail', upload.single('videoFile'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file uploaded.' });
    }

    const timestampString = req.body.timestamp;
    if (!timestampString || isNaN(parseFloat(timestampString))) {
      // Clean up uploaded file if timestamp is invalid
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Invalid or missing timestamp.' });
    }
    const timestamp = parseFloat(timestampString);

    const videoPath = req.file.path; // Absolute path to the uploaded video
    const thumbnailsDir = path.join(__dirname, '..', '..', 'thumbnails');
    const outputFilename = `thumb_${Date.now()}_${path.parse(req.file.filename).name}`;

    console.log(`Generating thumbnail for ${videoPath} at ${timestamp}s`);

    const thumbnailPath = await generateThumbnail(videoPath, timestamp, thumbnailsDir, outputFilename);
    
    // Construct URL relative to the server's static path for thumbnails
    const relativeThumbnailPath = path.relative(path.join(__dirname, '..', '..'), thumbnailPath);
    // Ensure consistent path separators for URL (replace backslashes with forward slashes)
    const thumbnailUrl = `/${relativeThumbnailPath.replace(/\\/g, '/')}`;

    res.status(200).json({
      success: true,
      thumbnailUrl: thumbnailUrl, // e.g., /thumbnails/thumb_12345.png
      message: 'Thumbnail generated successfully.'
    });

    // Optional: Clean up the source video file if it's only needed for this operation
    // fs.unlinkSync(videoPath);

  } catch (error: any) {
    console.error('Error in /thumbnail route:', error);
    // Clean up uploaded file in case of error during processing
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: 'Failed to generate thumbnail.', details: error.message });
  }
});

export default router;
