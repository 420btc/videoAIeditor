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

/**
 * Trims a video file from startTime to endTime.
 * @param videoPath Absolute path to the input video file.
 * @param startTime Start time in seconds.
 * @param endTime End time in seconds.
 * @param outputDir Directory where the trimmed video will be saved.
 * @param filename Optional filename for the output video.
 * @returns Promise resolving to the absolute path of the trimmed video.
 */
export const trimVideo = (
  videoPath: string,
  startTime: number,
  endTime: number,
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

    const outputFilename = filename || `trimmed_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);
    const duration = endTime - startTime;

    ffmpeg(videoPath)
      .seekInput(startTime)
      .duration(duration)
      .output(outputPath)
      .on('end', () => {
        console.log(`Video trimmed successfully: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`Error trimming video: ${err.message}`);
        reject(err);
      })
      .run();
  });
};

/**
 * Adjusts audio volume of a video file.
 * @param videoPath Absolute path to the input video file.
 * @param volumeLevel Volume level (1.0 = normal, 0.5 = half, 2.0 = double).
 * @param outputDir Directory where the processed video will be saved.
 * @param filename Optional filename for the output video.
 * @returns Promise resolving to the absolute path of the processed video.
 */
export const adjustAudioVolume = (
  videoPath: string,
  volumeLevel: number,
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

    const outputFilename = filename || `audio_adjusted_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    ffmpeg(videoPath)
      .audioFilters(`volume=${volumeLevel}`)
      .output(outputPath)
      .on('end', () => {
        console.log(`Audio adjusted successfully: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`Error adjusting audio: ${err.message}`);
        reject(err);
      })
      .run();
  });
};

/**
 * Adds subtitles to a video file.
 * @param videoPath Absolute path to the input video file.
 * @param subtitleText Text to add as subtitle.
 * @param startTime Start time in seconds.
 * @param endTime End time in seconds.
 * @param outputDir Directory where the processed video will be saved.
 * @param filename Optional filename for the output video.
 * @returns Promise resolving to the absolute path of the processed video.
 */
export const addSubtitles = (
  videoPath: string,
  subtitleText: string,
  startTime: number,
  endTime: number,
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

    const outputFilename = filename || `subtitled_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    // Escape special characters in subtitle text
    const escapedText = subtitleText.replace(/'/g, "\\'").replace(/:/g, "\\:");

    ffmpeg(videoPath)
      .videoFilters([
        {
          filter: 'drawtext',
          options: {
            text: escapedText,
            fontsize: 24,
            fontcolor: 'white',
            x: '(w-text_w)/2',
            y: 'h-text_h-20',
            enable: `between(t,${startTime},${endTime})`
          }
        }
      ])
      .output(outputPath)
      .on('end', () => {
        console.log(`Subtitles added successfully: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`Error adding subtitles: ${err.message}`);
        reject(err);
      })
      .run();
  });
};
