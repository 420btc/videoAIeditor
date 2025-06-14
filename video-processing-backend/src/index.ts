import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import editRoutes from './routes/editRoutes';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Ensure necessary directories exist
const thumbnailsDir = path.join(__dirname, '..', 'thumbnails');
const sourceVideosDir = path.join(__dirname, '..', 'source_videos');

if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}
if (!fs.existsSync(sourceVideosDir)) {
  fs.mkdirSync(sourceVideosDir, { recursive: true });
}

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Serve static files (thumbnails)
// This makes files in the 'thumbnails' directory accessible via URL
// e.g., http://localhost:3001/thumbnails/my_thumbnail.jpg
app.use('/thumbnails', express.static(thumbnailsDir));

// Basic Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', message: 'Video processing backend is healthy' });
});

app.use('/api/edit', editRoutes);

// Global Error Handler (simple version)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Video processing backend server is running on http://localhost:${PORT}`);
});
