import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

// Asegúrate de que FFmpeg esté instalado y en el PATH del sistema,
// o establece la ruta explícitamente:
// ffmpeg.setFfmpegPath('/path/to/your/ffmpeg');
// ffmpeg.setFfprobePath('/path/to/your/ffprobe');

/**
 * Generates a thumbnail from a video file at a specific timestamp.
 * @param videoPath Absolute path to the input video file.
 * @param timestamp Time in seconds to capture the thumbnail.
 * @param outputDir Absolute path to the directory where the thumbnail will be saved.
 * @param filename Optional filename for the thumbnail (without extension).
 * @returns Promise resolving to the absolute path of the generated thumbnail.
 */
export const generateThumbnail = (
  videoPath: string,
  timestamp: number,
  outputDir: string,
  filename?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(videoPath)) {
      return reject(new Error(`Video file not found at: ${videoPath}`));
    }
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilename = `${filename || 'thumb_' + Date.now()}.png`;
    const outputPath = path.join(outputDir, outputFilename);

    ffmpeg(videoPath)
      .on('end', () => {
        console.log(`Thumbnail generated successfully: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`Error generating thumbnail: ${err.message}`);
        reject(err);
      })
      .screenshots({
        count: 1,
        timemarks: [timestamp.toString()], // Timestamp in seconds
        filename: outputFilename,
        folder: outputDir,
        size: '320x?' // Optional: specify size, e.g., '320x240' or '320x?' to keep aspect ratio
      });
  });
};
