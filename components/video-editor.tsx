"use client"

import { useState, useCallback, useEffect } from "react"
import { Navbar } from "./navbar"
import { VideoUploadArea } from "./video-upload-area"
import { VideoPlayer } from "./video-player"
import MultiTrackTimeline from "./multi-track-timeline"
import { Sidebar } from "./sidebar"
import { AIAssistantPanel } from "./ai-assistant-panel"
import { VideoDownload } from "./video-download"
// import { TextOverlayPanel } from "./text-overlay-panel" // Removed
// import { TextOverlay } from "@/types/text-overlay" // Removed

interface VideoMetadata {
  filename: string
  duration: number
  fps: number
  resolution: string
  fileSize: number
  codec: string
  bitrate: number
  audioChannels: number
  audioSampleRate: number
  createdAt: string
}

interface MediaItem {
  id: string
  name: string
  type: "video" | "audio" | "image"
  duration?: number
  thumbnail: string
  fileSize: number
  dateAdded: string
  file?: File
}

interface TimelineClip {
  id: string
  name: string
  type: "video" | "audio" | "image"
  startTime: number
  duration: number
  trackIndex: number
  color: string
  thumbnail?: string
  locked?: boolean
  muted?: boolean
  visible?: boolean
  mediaId: string
  originalDuration?: number
  trimStart?: number
  trimEnd?: number
}

export default function VideoEditor() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [composedVideoFile, setComposedVideoFile] = useState<File | null>(null) // Video compuesto para reproducción
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | undefined>(undefined)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  // const [selectedTextId, setSelectedTextId] = useState<string | undefined>(undefined) // Removed
  const [isLoading, setIsLoading] = useState(false);
  // const [showTextOverlays, setShowTextOverlays] = useState(false); // Removed
  const [projectDuration, setProjectDuration] = useState(0); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ffmpegProgress, setFfmpegProgress] = useState(0); 

  // Estados para biblioteca y timeline
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([])
  const [timelineClips, setTimelineClips] = useState<TimelineClip[]>([])
  // const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]) // Removed

  const getClipColor = (type: string, index: number) => {
    const colors = {
      video: ["bg-blue-600", "bg-green-600", "bg-purple-600", "bg-indigo-600"],
      audio: ["bg-orange-600", "bg-red-600", "bg-pink-600", "bg-yellow-600"],
      image: ["bg-teal-600", "bg-cyan-600", "bg-emerald-600", "bg-lime-600"],
    }
    return colors[type as keyof typeof colors][index % colors[type as keyof typeof colors].length]
  }

  // Calcular duración del proyecto basada en clips
  const calculateProjectDuration = useCallback(() => {
    if (timelineClips.length === 0) return videoDuration || 0

    const maxEndTime = Math.max(...timelineClips.map((clip) => clip.startTime + clip.duration))
    return maxEndTime // No agregar buffer, usar la duración real de los clips
  }, [timelineClips, videoDuration])

  // Función para componer el video basado en los clips del timeline
  const composeTimelineVideo = useCallback(async () => {
    if (timelineClips.length === 0 || !videoFile) {
      setComposedVideoFile(videoFile)
      return
    }

    try {
      // Buscar el clip de video principal en el timeline
      const mainVideoClip = timelineClips.find(clip => clip.type === 'video' && clip.trackIndex === 0)
      
      if (mainVideoClip) {
        // Verificar si el clip tiene recortes aplicados
        const hasTrims = mainVideoClip.trimStart !== undefined && 
                        mainVideoClip.trimEnd !== undefined &&
                        (mainVideoClip.trimStart > 0 || mainVideoClip.trimEnd < (mainVideoClip.originalDuration || videoDuration))
        
        if (hasTrims) {
          console.log('Composing video with trims:', {
            trimStart: mainVideoClip.trimStart,
            trimEnd: mainVideoClip.trimEnd,
            originalDuration: mainVideoClip.originalDuration
          })
          
          // Crear una versión recortada del video
          const { default: ffmpegService } = await import('../lib/ffmpeg-service')
          await ffmpegService.load()
          
          const trimmedBlob = await ffmpegService.trimVideo(
            videoFile, 
            mainVideoClip.trimStart!, 
            mainVideoClip.trimEnd!,
            (progress) => console.log('Composing progress:', progress)
          )
          
          const trimmedFile = new File([trimmedBlob], `composed_${videoFile.name}`, { type: videoFile.type })
          setComposedVideoFile(trimmedFile)
          console.log('Composed video created with trims')
        } else {
          // Si no hay recortes significativos, usar el video original
          setComposedVideoFile(videoFile)
          console.log('Using original video (no significant trims)')
        }
      } else {
        // Si no hay clip de video principal, usar el video original
        setComposedVideoFile(videoFile)
        console.log('Using original video (no main video clip found)')
      }
    } catch (error) {
      console.error('Error composing timeline video:', error)
      // En caso de error, usar el video original
      setComposedVideoFile(videoFile)
    }
  }, [timelineClips, videoFile, videoDuration])

  // Actualizar duración del proyecto cuando cambien los clips o la duración del video base
  useEffect(() => {
    const newProjectDuration = calculateProjectDuration();
    setProjectDuration(newProjectDuration);
  }, [timelineClips, videoDuration, calculateProjectDuration, setProjectDuration]);

  // Componer el video cuando cambien los clips del timeline
  useEffect(() => {
    composeTimelineVideo();
  }, [timelineClips, composeTimelineVideo]);

  const handleVideoUpload = useCallback((file: File) => {
    setIsLoading(true);
    setVideoFile(file);
    setVideoMetadata(undefined); // Clear previous metadata, corrected to undefined
    setVideoDuration(0);    // Reset duration
    setProjectDuration(0);  // Reset project duration
    setCurrentTime(0);      // Reset current time
    setTimelineClips([]);   // Clear timeline

    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.muted = true; // Importante para WebM

    const objectUrl = URL.createObjectURL(file);
    let metadataAttempts = 0;
    const maxAttempts = 3;

    const processVideoMetadata = (duration: number) => {
      console.log('Processing video metadata for:', file.name, 'Duration:', duration);
      
      const newMetadata: VideoMetadata = {
        filename: file.name,
        duration: duration,
        fps: 30, // Placeholder, consider extracting if possible
        resolution: `${videoElement.videoWidth}x${videoElement.videoHeight}`,
        fileSize: file.size / (1024 * 1024),
        codec: 'N/A', // Placeholder
        bitrate: 0, // Placeholder
        audioChannels: 0, // Placeholder
        audioSampleRate: 0, // Placeholder
        createdAt: new Date().toLocaleDateString('es-ES'),
      };

      console.log('Setting video metadata:', newMetadata);
      setVideoMetadata(newMetadata);
      setVideoDuration(duration);
      setProjectDuration(duration); // Initialize project duration with the first video's duration
      setCurrentTime(0);

      // Add to media library
      const newMediaItem: MediaItem = {
        id: `media_${Date.now()}`,
        name: file.name,
        type: 'video',
        duration: duration,
        thumbnail: '/placeholder.svg?height=60&width=80', // Placeholder, generate later if needed
        fileSize: newMetadata.fileSize,
        dateAdded: new Date().toISOString().split('T')[0],
        file: file, // Store the actual file object if needed for direct use
      };
      setMediaLibrary((prev) => [...prev, newMediaItem]);

      // Add to timeline
      const newClip: TimelineClip = {
        id: `clip_${Date.now()}`,
        mediaId: newMediaItem.id,
        name: file.name,
        type: 'video',
        startTime: 0,
        duration: duration,
        originalDuration: duration,
        trackIndex: 0, // Default to first video track
        color: getClipColor('video', 0),
        thumbnail: '/placeholder.svg?height=40&width=60',
        locked: false,
        muted: false,
        visible: true,
        trimStart: 0,
        trimEnd: duration,
      };
      setTimelineClips([newClip]); // Replace timeline with this new clip for now
      console.log('VideoEditor - Created new clip:', newClip);
      console.log('VideoEditor - Timeline clips after setting:', [newClip]);
      
      // Inicializar el video compuesto con el video original
      setComposedVideoFile(file);
      
      setIsLoading(false);
      URL.revokeObjectURL(objectUrl); // Revoke URL after successful processing
      setErrorMessage(null); // Clear any previous error message
    };

    const tryGetDuration = () => {
      const duration = videoElement.duration;
      console.log(`Attempt ${metadataAttempts + 1}: Duration for ${file.name}:`, duration);
      
      if (isFinite(duration) && !isNaN(duration) && duration > 0) {
        processVideoMetadata(duration);
        return true;
      }
      return false;
    };

    const onMetadataLoaded = () => {
      console.log('Video metadata loaded event triggered for:', file.name, 'Duration:', videoElement.duration);
      
      if (tryGetDuration()) {
        return;
      }
      
      // Para archivos WebM, a veces necesitamos esperar un poco más
      if (file.name.toLowerCase().endsWith('.webm') && metadataAttempts < maxAttempts) {
        metadataAttempts++;
        console.log(`WebM file detected, retrying metadata load (attempt ${metadataAttempts})`);
        
        setTimeout(() => {
          if (tryGetDuration()) {
            return;
          }
          
          // Último intento: forzar la carga del video
          videoElement.currentTime = 0.1;
          setTimeout(() => {
            if (!tryGetDuration()) {
              console.error('Invalid video duration after all attempts:', videoElement.duration, 'for file:', file.name);
              setErrorMessage(`Error: No se pudo obtener la duración del video ${file.name}. Formato WebM puede no ser completamente compatible.`);
              setIsLoading(false);
              URL.revokeObjectURL(objectUrl);
            }
          }, 500);
        }, 1000);
      } else {
        console.error('Invalid video duration after metadata loaded:', videoElement.duration, 'for file:', file.name);
        setErrorMessage(`Error: Duración de video inválida (${videoElement.duration}) para ${file.name}`);
        setIsLoading(false);
        URL.revokeObjectURL(objectUrl); // Crucial: Revoke URL on error path
      }
    };

    const onCanPlay = () => {
      console.log('Video canplay event triggered for:', file.name);
      if (!isFinite(videoElement.duration) || isNaN(videoElement.duration) || videoElement.duration <= 0) {
        tryGetDuration();
      }
    };

    const onDurationChange = () => {
       console.log('Video durationchange event triggered for:', file.name, 'Duration:', videoElement.duration);
       tryGetDuration();
     };

     const onError = (error: Event) => {
       console.error('Error loading video:', file.name, error);
       setErrorMessage(`Error al cargar el video: ${file.name}`);
       setIsLoading(false);
       URL.revokeObjectURL(objectUrl);
     };

     // Agregar múltiples event listeners para mejor compatibilidad con WebM
     videoElement.addEventListener('loadedmetadata', onMetadataLoaded);
     videoElement.addEventListener('canplay', onCanPlay);
     videoElement.addEventListener('durationchange', onDurationChange);
     videoElement.addEventListener('error', onError);

     videoElement.src = objectUrl;
     videoElement.load(); // Forzar la carga
   }, []);

  const handleSeekTo = useCallback((time: number) => {
    console.log('handleSeekTo called with time:', time)
    setCurrentTime(time)
    console.log('currentTime updated to:', time)
  }, [])

  const handleDeleteMedia = useCallback((mediaId: string) => {
    // Encontrar el archivo que se va a eliminar
    const mediaToDelete = mediaLibrary.find(item => item.id === mediaId);
    
    // Eliminar de la biblioteca
    setMediaLibrary((prev) => prev.filter((item) => item.id !== mediaId))

    // Eliminar todos los clips de la timeline que usen este archivo
    setTimelineClips((prev) => prev.filter((clip) => clip.mediaId !== mediaId))
    
    // Si el archivo eliminado es el video principal actual, quitar el video del reproductor
    if (mediaToDelete && mediaToDelete.file === videoFile) {
      setVideoFile(null);
      setComposedVideoFile(null);
      setVideoMetadata(undefined);
      setVideoDuration(0);
      setProjectDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [mediaLibrary, videoFile])

  const handleDeleteClip = useCallback((clipId: string) => {
    // Encontrar el clip que se va a eliminar
    const clipToDelete = timelineClips.find(clip => clip.id === clipId);
    
    // Eliminar el clip de la timeline
    setTimelineClips((prev) => prev.filter((clip) => clip.id !== clipId))
    
    // Si el clip eliminado es el video principal (trackIndex 0 y tipo video), verificar si queda algún video principal
    if (clipToDelete && clipToDelete.type === 'video' && clipToDelete.trackIndex === 0) {
      const remainingMainVideoClips = timelineClips.filter(clip => 
        clip.id !== clipId && clip.type === 'video' && clip.trackIndex === 0
      );
      
      // Si no quedan clips de video principales, quitar el video del reproductor
      if (remainingMainVideoClips.length === 0) {
        setVideoFile(null);
        setComposedVideoFile(null);
        setVideoMetadata(undefined);
        setVideoDuration(0);
        setProjectDuration(0);
        setCurrentTime(0);
        setIsPlaying(false);
      }
    }
  }, [timelineClips])

  const handleImportMedia = useCallback(() => {
    // Crear un input file temporal
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = "video/*,audio/*,image/*"

    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        Array.from(files).forEach((file) => {
          const fileType = file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "image"

          const newMediaItem: MediaItem = {
            id: `media_${Date.now()}_${Math.random()}`,
            name: file.name,
            type: fileType,
            duration: fileType === "image" ? 5 : 60, // 5 segundos para imágenes, 60 para audio
            thumbnail: "/placeholder.svg?height=60&width=80",
            fileSize: file.size / (1024 * 1024), // Convert to MB
            dateAdded: new Date().toISOString().split("T")[0],
            file: file,
          }

          setMediaLibrary((prev) => [...prev, newMediaItem])
        })
      }
    }

    input.click()
  }, [])

  const handleDropToTimeline = useCallback(
    (mediaItem: MediaItem, trackIndex: number, dropTime: number) => {
      const existingClipsCount = timelineClips.filter((clip) => clip.type === mediaItem.type).length

      const newClip: TimelineClip = {
        id: `clip_${Date.now()}_${Math.random()}`,
        name: mediaItem.name,
        type: mediaItem.type,
        startTime: dropTime,
        duration: mediaItem.duration || 5,
        trackIndex: trackIndex,
        color: getClipColor(mediaItem.type, existingClipsCount),
        thumbnail: mediaItem.thumbnail,
        mediaId: mediaItem.id,
        locked: false,
        muted: false,
        visible: true,
        originalDuration: mediaItem.duration || 5,
        trimStart: 0,
        trimEnd: mediaItem.duration || 5,
      }

      setTimelineClips((prev) => [...prev, newClip])
    },
    [timelineClips],
  )

  const handleMoveClip = useCallback((clipId: string, newStartTime: number, newTrackIndex?: number) => {
    setTimelineClips((prev) =>
      prev.map((clip) => {
        if (clip.id === clipId) {
          return {
            ...clip,
            startTime: Math.max(0, newStartTime),
            ...(newTrackIndex !== undefined && { trackIndex: newTrackIndex }),
          }
        }
        return clip
      }),
    )
  }, [])

  const handleResizeClip = useCallback((clipId: string, newDuration: number, resizeStart?: boolean) => {
    setTimelineClips((prev) =>
      prev.map((clip) => {
        if (clip.id === clipId) {
          if (resizeStart) {
            // Redimensionar desde el inicio (cambiar startTime y duration)
            const timeDiff = clip.duration - newDuration
            return {
              ...clip,
              startTime: Math.max(0, clip.startTime + timeDiff),
              duration: Math.max(0.1, newDuration),
            }
          } else {
            // Redimensionar desde el final (solo cambiar duration)
            return {
              ...clip,
              duration: Math.max(0.1, newDuration),
            }
          }
        }
        return clip
      }),
    )
  }, [])

  const handleSplitClip = useCallback((clipId: string, splitTime: number) => {
    setTimelineClips((prev) => {
      const clipIndex = prev.findIndex((clip) => clip.id === clipId)
      if (clipIndex === -1) return prev

      const originalClip = prev[clipIndex]
      const splitPoint = splitTime - originalClip.startTime

      if (splitPoint <= 0 || splitPoint >= originalClip.duration) return prev

      // Crear dos nuevos clips
      const firstClip: TimelineClip = {
        ...originalClip,
        id: `clip_${Date.now()}_1`,
        duration: splitPoint,
      }

      const secondClip: TimelineClip = {
        ...originalClip,
        id: `clip_${Date.now()}_2`,
        startTime: originalClip.startTime + splitPoint,
        duration: originalClip.duration - splitPoint,
      }

      // Reemplazar el clip original con los dos nuevos
      const newClips = [...prev]
      newClips.splice(clipIndex, 1, firstClip, secondClip)
      return newClips
    })
  }, [])

  // Process video with FFmpeg in frontend
  const processVideoWithFFmpeg = useCallback(async (action: string, data: any) => {
    if (!videoFile) return;

    try {
      setIsLoading(true);
      setFfmpegProgress(0);
      
      // Dynamically import FFmpeg service to avoid SSR issues
      const { default: ffmpegService } = await import('../lib/ffmpeg-service');
      
      // Load FFmpeg if not already loaded
      await ffmpegService.load();
      
      // Progress callback
      const onProgress = (progress: number) => {
        setFfmpegProgress(progress);
      };
      
      let processedBlob: Blob;
      
      switch (action) {
        case 'video_trimmed':
          processedBlob = await ffmpegService.trimVideo(videoFile, data.startTime, data.endTime, onProgress);
          break;
        case 'audio_adjusted':
          const volumeLevel = data.action === 'volume' ? (data.value / 100) : 
                             data.action === 'increase' ? 1.5 : 
                             data.action === 'decrease' ? 0.5 : 1.0;
          processedBlob = await ffmpegService.adjustAudio(videoFile, volumeLevel, onProgress);
          break;
        case 'subtitle_added':
          const subtitles = [{
            start: data.startTime,
            end: data.endTime,
            text: data.text
          }];
          processedBlob = await ffmpegService.addSubtitles(videoFile, subtitles, onProgress);
          break;
        default:
          return; // No processing needed
      }

      const processedFile = new File([processedBlob], `processed_${videoFile.name}`, { type: videoFile.type });
      
      // Update the video file with the processed version
      setVideoFile(processedFile);
      
      // También actualizar el video compuesto
      setComposedVideoFile(processedFile);
      
      // Update media library with processed file
      setMediaLibrary(prev => prev.map(item => 
        item.file === videoFile 
          ? { ...item, file: processedFile, name: processedFile.name }
          : item
      ));
      
      // Update timeline clips that reference the original video
      setTimelineClips(prev => prev.map(clip => {
          // Find the media item that matches this clip
          const mediaItem = mediaLibrary.find(media => media.id === clip.mediaId);
          if (mediaItem && mediaItem.file === videoFile) {
            return { 
              ...clip, 
              name: processedFile.name,
              // Update duration if it's the main video clip and action was trim
              duration: action === 'video_trimmed' && clip.trackIndex === 0 ? data.newDuration : clip.duration,
              originalDuration: action === 'video_trimmed' && clip.trackIndex === 0 ? data.newDuration : clip.originalDuration
            };
          }
          return clip;
        }));
        
        // Reset player state
        setCurrentTime(0);
        setIsPlaying(false);
        
        console.log('Video processed successfully with FFmpeg');
        
    } catch (error) {
      console.error('Error processing video with FFmpeg:', error);
      setErrorMessage('Error al procesar el video con FFmpeg');
    } finally {
      setIsLoading(false);
      setFfmpegProgress(0);
    }
  }, [videoFile, setVideoFile, setMediaLibrary, mediaLibrary, setTimelineClips, setCurrentTime, setIsPlaying, setIsLoading, setErrorMessage]);

  // AI Action Handler - processes AI editing commands
  const handleAIAction = useCallback(async (action: string, data: any) => {
    console.log('AI Action received:', action, data);
    
    // Process video with FFmpeg for actions that modify the video file
    if (['video_trimmed', 'audio_adjusted', 'subtitle_added'].includes(action)) {
      await processVideoWithFFmpeg(action, data);
    }
    
    switch (action) {
      case 'subtitle_added':
        // Add subtitle to timeline as a text overlay
        const subtitleClip: TimelineClip = {
          id: `subtitle_${Date.now()}`,
          name: `Subtitle: ${data.text.substring(0, 20)}...`,
          type: "video", // Using video type for text overlays
          startTime: data.startTime,
          duration: data.endTime - data.startTime,
          trackIndex: 2, // Use text track
          color: "bg-yellow-600",
          mediaId: "subtitle",
          originalDuration: data.endTime - data.startTime,
        };
        setTimelineClips(prev => [...prev, subtitleClip]);
        break;
        
      case 'video_trimmed':
        // Update video duration and metadata
        setVideoDuration(data.newDuration);
        // Functional update for videoMetadata
        setVideoMetadata(prevMetadata => {
          if (!prevMetadata) return undefined;
          return { ...prevMetadata, duration: data.newDuration };
        });
        break;
        
      case 'transition_added':
        // Add transition effect to timeline
        const transitionClip: TimelineClip = {
          id: `transition_${Date.now()}`,
          name: `${data.type} transition`,
          type: "video",
          startTime: data.position,
          duration: data.duration,
          trackIndex: 1, // Use effects track
          color: "bg-purple-600",
          mediaId: "transition",
          originalDuration: data.duration,
        };
        setTimelineClips(prev => [...prev, transitionClip]);
        // Reset video player to beginning after AI edit
        setCurrentTime(0);
        setIsPlaying(false);
        break;
        
      case 'audio_adjusted':
        // Update audio clips or add audio effect indicator
        const audioClip: TimelineClip = {
          id: `audio_${Date.now()}`,
          name: `Audio: ${data.action} ${data.value}`,
          type: "audio",
          startTime: data.startTime || 0,
          duration: data.endTime ? (data.endTime - (data.startTime || 0)) : videoDuration,
          trackIndex: 0, // Audio track
          color: "bg-orange-600",
          mediaId: "audio_effect",
          originalDuration: data.endTime ? (data.endTime - (data.startTime || 0)) : videoDuration,
        }
        setTimelineClips(prev => [...prev, audioClip])
        break
        
      case 'thumbnail_generated':
        // Update video metadata or show notification
        console.log('Thumbnail generated:', data.url)
        // Reset video player to beginning after AI edit
        setCurrentTime(0);
        setIsPlaying(false);
        break
        
      case 'video_analyzed':
        // Process analysis results - could add markers to timeline
        console.log('Video analysis completed:', data.results)
        // Reset video player to beginning after AI edit
        setCurrentTime(0);
        setIsPlaying(false);
        break
        
      default:
        console.log('Unknown AI action:', action)
    }
  }, [videoFile, setTimelineClips, setVideoDuration, setVideoMetadata, videoDuration, setIsLoading, setErrorMessage, setVideoFile, setCurrentTime, setIsPlaying, setMediaLibrary, mediaLibrary]);
  
  return (
  <div className="h-screen flex flex-col overflow-hidden">
    <Navbar />

    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        videoMetadata={videoMetadata}
        onSeekTo={handleSeekTo}
        mediaLibrary={mediaLibrary}
        onDeleteMedia={handleDeleteMedia}
        onImportMedia={handleImportMedia}
      />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Upload/Player Area */}
          <div className="flex-1 bg-black border border-gray-700 rounded-lg overflow-hidden">
            {!videoFile ? (
              <VideoUploadArea onVideoUpload={handleVideoUpload} />
            ) : (
              <VideoPlayer
                videoFile={composedVideoFile || videoFile}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onTimeUpdate={setCurrentTime}
                onPlayPause={setIsPlaying}
                videoDuration={videoDuration} 
              />
            )}
          </div>

          {/* Multi-Track Timeline */}
          <div className="h-64 border-t border-gray-700 overflow-hidden">
            <MultiTrackTimeline
              duration={projectDuration}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTimeChange={setCurrentTime}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              clips={timelineClips}
              onDeleteClip={handleDeleteClip}
              onDropToTimeline={handleDropToTimeline}
              onMoveClip={handleMoveClip}
              onResizeClip={handleResizeClip}
              onSplitClip={handleSplitClip}
              onUpdateClips={setTimelineClips}
              mediaLibrary={mediaLibrary}
            />
          </div>
        </div>

        {/* Right AI Assistant Panel */}
        <div className="flex flex-col w-72 max-w-72">
          <div className="flex-1 min-h-0">
            <AIAssistantPanel 
              onAIAction={handleAIAction}
              videoFile={videoFile}
              videoDuration={videoDuration}
              currentTime={currentTime}
            />
          </div>
          
          {/* Video Download Panel */}
          <div className="mt-2 flex-shrink-0">
            <VideoDownload 
              videoFile={videoFile}
              isProcessing={isLoading}
              processingProgress={ffmpegProgress}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
