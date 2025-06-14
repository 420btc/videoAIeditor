"use client"

import { useState, useCallback, useEffect } from "react"
import { Navbar } from "./navbar"
import { VideoUploadArea } from "./video-upload-area"
import { VideoPlayer } from "./video-player"
import { MultiTrackTimeline } from "./multi-track-timeline"
import { Sidebar } from "./sidebar"
import { AIAssistantPanel } from "./ai-assistant-panel"
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
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | undefined>(undefined)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  // const [selectedTextId, setSelectedTextId] = useState<string | undefined>(undefined) // Removed
  const [isLoading, setIsLoading] = useState(false);
  // const [showTextOverlays, setShowTextOverlays] = useState(false); // Removed
  const [projectDuration, setProjectDuration] = useState(0); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null); 

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

  // Actualizar duración del proyecto cuando cambien los clips o la duración del video base
  useEffect(() => {
    const newProjectDuration = calculateProjectDuration();
    setProjectDuration(newProjectDuration);
  }, [timelineClips, videoDuration, calculateProjectDuration, setProjectDuration]);

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

    const objectUrl = URL.createObjectURL(file);

    const onMetadataLoaded = () => {
      console.log('Video metadata loaded event triggered for:', file.name, 'Duration:', videoElement.duration);
      const realDuration = videoElement.duration;

      if (!isFinite(realDuration) || isNaN(realDuration) || realDuration <= 0) {
        console.error('Invalid video duration after metadata loaded:', realDuration, 'for file:', file.name);
        setErrorMessage(`Error: Duración de video inválida (${realDuration}) para ${file.name}`);
        setIsLoading(false);
        URL.revokeObjectURL(objectUrl); // Crucial: Revoke URL on error path
        return;
      }

      const newMetadata: VideoMetadata = {
        filename: file.name,
        duration: realDuration,
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
      setVideoDuration(realDuration);
      setProjectDuration(realDuration); // Initialize project duration with the first video's duration
      setCurrentTime(0);

      // Add to media library
      const newMediaItem: MediaItem = {
        id: `media_${Date.now()}`,
        name: file.name,
        type: 'video',
        duration: realDuration,
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
        duration: realDuration,
        originalDuration: realDuration,
        trackIndex: 0, // Default to first video track
        color: getClipColor('video', 0),
        thumbnail: '/placeholder.svg?height=40&width=60',
        locked: false,
        muted: false,
        visible: true,
        trimStart: 0,
        trimEnd: realDuration,
      };
      setTimelineClips([newClip]); // Replace timeline with this new clip for now
      
      setIsLoading(false);
      URL.revokeObjectURL(objectUrl); // Revoke URL after successful processing
      setErrorMessage(null); // Clear any previous error message
    };

    const onVideoError = (event: Event | string) => {
      console.error('Error loading video:', file.name, event);
      // Attempt to get more specific error from video element if possible
      const videoError = videoElement.error;
      let errorMessageText = `Error al cargar el video ${file.name}.`;
      if (videoError) {
        switch (videoError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessageText += ' Carga abortada.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessageText += ' Error de red.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessageText += ' Error de decodificación.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessageText += ' Formato no soportado.';
            break;
          default:
            errorMessageText += ' Error desconocido.';
        }
        console.error('MediaError details:', videoError.message, videoError.code);
      }
      setErrorMessage(errorMessageText);
      setIsLoading(false);
      URL.revokeObjectURL(objectUrl); // Crucial: Revoke URL on error path
    };

    videoElement.addEventListener('loadedmetadata', onMetadataLoaded);
    videoElement.addEventListener('error', onVideoError);

    videoElement.src = objectUrl;
    // videoElement.load(); // Explicitly call load, though setting src usually triggers it.
    console.log('Video src set, attempting to load metadata for:', file.name);

  }, [setVideoFile, setIsLoading, setVideoMetadata, setVideoDuration, setProjectDuration, setCurrentTime, setMediaLibrary, setTimelineClips, getClipColor, setErrorMessage]); // Removed setShowTextOverlays from deps

  const handleSeekTo = useCallback((time: number) => {
    console.log('handleSeekTo called with time:', time)
    setCurrentTime(time)
    console.log('currentTime updated to:', time)
  }, [])

  const handleDeleteMedia = useCallback((mediaId: string) => {
    // Eliminar de la biblioteca
    setMediaLibrary((prev) => prev.filter((item) => item.id !== mediaId))

    // Eliminar todos los clips de la timeline que usen este archivo
    setTimelineClips((prev) => prev.filter((clip) => clip.mediaId !== mediaId))
  }, [])

  const handleDeleteClip = useCallback((clipId: string) => {
    setTimelineClips((prev) => prev.filter((clip) => clip.id !== clipId))
  }, [])

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

  // AI Action Handler - processes AI editing commands
  const handleAIAction = useCallback((action: string, data: any) => {
    console.log('Processing AI action:', action, data)
    
    switch (action) {
      case 'subtitle_added':
        // Add subtitle to timeline
        const subtitleClip: TimelineClip = {
          id: `subtitle_${Date.now()}`,
          name: `Subtitle: "${data.text}"`,
          type: "video",
          startTime: data.startTime,
          duration: data.endTime - data.startTime,
          trackIndex: 2, // Use a subtitle track
          color: "bg-yellow-600",
          mediaId: "subtitle",
          originalDuration: data.endTime - data.startTime,
        }
        setTimelineClips(prev => [...prev, subtitleClip])
        break

      case 'video_trimmed':
        // Update existing video clips to reflect trim
        setTimelineClips(prevClips => prevClips.map(clip => {
          // Using original logic for identifying the clip to be trimmed
          if (clip.type === 'video' && clip.mediaId !== 'subtitle') { 
            return {
              ...clip,
              startTime: Math.max(0, clip.startTime - data.startTime), 
              duration: Math.min(clip.duration, data.newDuration),
              trimStart: data.startTime,
              trimEnd: data.endTime,
            };
          }
          return clip;
        }));
        // Update video duration - removed +30
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
        break
        
      case 'video_analyzed':
        // Process analysis results - could add markers to timeline
        console.log('Video analysis completed:', data.results)
        break
        
      default:
        console.log('Unknown AI action:', action)
    }
  }, [videoFile?.name, setTimelineClips, setVideoDuration, setVideoMetadata, videoDuration]);
  
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
                videoFile={videoFile}
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
        <AIAssistantPanel onAIAction={handleAIAction} />
      </div>
    </div>
  )
}
