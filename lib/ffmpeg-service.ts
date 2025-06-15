import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;

  async load() {
    if (this.isLoaded) return;

    this.ffmpeg = new FFmpeg();
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    this.isLoaded = true;
  }

  async trimVideo(file: File, startTime: number, endTime: number, onProgress?: (progress: number) => void): Promise<Blob> {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }

    try {
      const inputName = 'input.mp4';
      const outputName = 'output.mp4';
      
      // Set progress callback
      if (onProgress) {
        this.ffmpeg.on('progress', ({ progress }) => {
          onProgress(progress);
        });
      }
      
      // Write input file
      await this.ffmpeg.writeFile(inputName, await fetchFile(file));
      
      // Trim video command
      await this.ffmpeg.exec([
        '-i', inputName,
        '-ss', startTime.toString(),
        '-to', endTime.toString(),
        '-c', 'copy',
        outputName
      ]);
      
      // Read output file
      const data = await this.ffmpeg.readFile(outputName);
      
      // Clean up
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);
      
      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      console.error('Error trimming video:', error);
      throw error;
    }
  }

  async addSubtitles(videoFile: File, subtitles: Array<{start: number, end: number, text: string}>, onProgress?: (progress: number) => void): Promise<Blob> {
    if (!this.ffmpeg) throw new Error('FFmpeg not loaded');

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';
    const subtitleName = 'subtitles.srt';

    // Set progress callback
    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress);
      });
    }

    // Create SRT content
    let srtContent = '';
    subtitles.forEach((sub, index) => {
      const startTime = this.formatTime(sub.start);
      const endTime = this.formatTime(sub.end);
      srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}\n\n`;
    });

    // Write files
    await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));
    await this.ffmpeg.writeFile(subtitleName, new TextEncoder().encode(srtContent));

    // Execute subtitle command
    await this.ffmpeg.exec([
      '-i', inputName,
      '-vf', `subtitles=${subtitleName}:force_style='FontSize=24,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,Outline=2'`,
      '-c:a', 'copy',
      outputName
    ]);

    // Read output file
    const data = await this.ffmpeg.readFile(outputName);
    
    // Clean up
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    await this.ffmpeg.deleteFile(subtitleName);

    return new Blob([data], { type: 'video/mp4' });
  }

  async adjustAudio(file: File, volumeLevel: number, onProgress?: (progress: number) => void): Promise<Blob> {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }

    try {
      const inputName = 'input.mp4';
      const outputName = 'output.mp4';
      
      // Set progress callback
      if (onProgress) {
        this.ffmpeg.on('progress', ({ progress }) => {
          onProgress(progress);
        });
      }
      
      // Write input file
      await this.ffmpeg.writeFile(inputName, await fetchFile(file));
      
      // Adjust audio volume command
      await this.ffmpeg.exec([
        '-i', inputName,
        '-af', `volume=${volumeLevel}`,
        '-c:v', 'copy',
        outputName
      ]);
      
      // Read output file
      const data = await this.ffmpeg.readFile(outputName);
      
      // Clean up
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);
      
      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      console.error('Error adjusting audio:', error);
      throw error;
    }
  }

  async generateThumbnail(videoFile: File, timestamp: number): Promise<Blob> {
    if (!this.ffmpeg) throw new Error('FFmpeg not loaded');

    const inputName = 'input.mp4';
    const outputName = 'thumbnail.jpg';

    // Write input file
    await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    // Execute thumbnail generation command
    await this.ffmpeg.exec([
      '-i', inputName,
      '-ss', timestamp.toString(),
      '-vframes', '1',
      '-q:v', '2',
      outputName
    ]);

    // Read output file
    const data = await this.ffmpeg.readFile(outputName);
    
    // Clean up
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([data], { type: 'image/jpeg' });
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  onProgress(callback: (progress: number) => void) {
    if (!this.ffmpeg) return;
    
    this.ffmpeg.on('progress', ({ progress }) => {
      callback(progress);
    });
  }

  onLog(callback: (message: string) => void) {
    if (!this.ffmpeg) return;
    
    this.ffmpeg.on('log', ({ message }) => {
      callback(message);
    });
  }
}

export const ffmpegService = new FFmpegService();
export default ffmpegService;