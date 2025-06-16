import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateThumbnail, trimVideo, adjustAudioVolume, addSubtitles } from '../services/ffmpegService';

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

// POST /api/edit/trim
router.post('/trim', upload.single('videoFile'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file uploaded.' });
    }

    const { startTime, endTime } = req.body;
    const start = parseFloat(startTime);
    const end = parseFloat(endTime);
    if (!startTime || !endTime || isNaN(start) || isNaN(end) || end <= start) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Invalid or missing startTime/endTime.' });
    }

    const videoPath = req.file.path;
    const outputDir = path.join(__dirname, '..', '..', 'source_videos');
    const outputFilename = `trimmed_${Date.now()}_${path.parse(req.file.filename).name}.mp4`;

    console.log(`Trimming video ${videoPath} from ${startTime}s to ${endTime}s`);

    const trimmedVideoPath = await trimVideo(
      videoPath,
      start,
      end,
      outputDir,
      outputFilename
    );

    // Return the processed video file
    res.download(trimmedVideoPath, outputFilename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ success: false, error: 'Failed to send processed video.' });
      }
      // Clean up files after sending
      setTimeout(() => {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        if (fs.existsSync(trimmedVideoPath)) fs.unlinkSync(trimmedVideoPath);
      }, 5000);
    });

  } catch (error: any) {
    console.error('Error in /trim route:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: 'Failed to trim video.', details: error.message });
  }
});

// POST /api/edit/adjust-audio
router.post('/adjust-audio', upload.single('videoFile'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file uploaded.' });
    }

    const { volumeLevel } = req.body;
    if (!volumeLevel || isNaN(parseFloat(volumeLevel))) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Invalid or missing volumeLevel.' });
    }

    const videoPath = req.file.path;
    const outputDir = path.join(__dirname, '..', '..', 'source_videos');
    const outputFilename = `audio_adjusted_${Date.now()}_${path.parse(req.file.filename).name}.mp4`;

    console.log(`Adjusting audio volume of ${videoPath} to ${volumeLevel}`);

    const processedVideoPath = await adjustAudioVolume(
      videoPath,
      parseFloat(volumeLevel),
      outputDir,
      outputFilename
    );

    // Return the processed video file
    res.download(processedVideoPath, outputFilename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ success: false, error: 'Failed to send processed video.' });
      }
      // Clean up files after sending
      setTimeout(() => {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        if (fs.existsSync(processedVideoPath)) fs.unlinkSync(processedVideoPath);
      }, 5000);
    });

  } catch (error: any) {
    console.error('Error in /adjust-audio route:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: 'Failed to adjust audio.', details: error.message });
  }
});

// POST /api/edit/add-subtitles
router.post('/add-subtitles', upload.single('videoFile'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file uploaded.' });
    }

    const { text, startTime, endTime } = req.body;
    if (!text || !startTime || !endTime || isNaN(parseFloat(startTime)) || isNaN(parseFloat(endTime))) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Invalid or missing text/startTime/endTime.' });
    }

    const videoPath = req.file.path;
    const outputDir = path.join(__dirname, '..', '..', 'source_videos');
    const outputFilename = `subtitled_${Date.now()}_${path.parse(req.file.filename).name}.mp4`;

    console.log(`Adding subtitles to ${videoPath}: "${text}" from ${startTime}s to ${endTime}s`);

    const processedVideoPath = await addSubtitles(
      videoPath,
      text,
      parseFloat(startTime),
      parseFloat(endTime),
      outputDir,
      outputFilename
    );

    // Return the processed video file
    res.download(processedVideoPath, outputFilename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ success: false, error: 'Failed to send processed video.' });
      }
      // Clean up files after sending
      setTimeout(() => {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        if (fs.existsSync(processedVideoPath)) fs.unlinkSync(processedVideoPath);
      }, 5000);
    });

  } catch (error: any) {
    console.error('Error in /add-subtitles route:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: 'Failed to add subtitles.', details: error.message });
  }
});

export default router;
