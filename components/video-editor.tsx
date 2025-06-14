"use client"

import { useState, useCallback, useEffect } from "react"
import { Navbar } from "./navbar"
import { VideoUploadArea } from "./video-upload-area"
import { VideoPlayer } from "./video-player"
import { MultiTrackTimeline } from "./multi-track-timeline"
import { Sidebar } from "./sidebar"
import { AIAssistantPanel } from "./ai-assistant-panel"

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
  const [videoDuration, setVideoDuration] = useState(120) // Duración mínima por defecto
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Estados para biblioteca y timeline
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([])
  const [timelineClips, setTimelineClips] = useState<TimelineClip[]>([])

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
    if (timelineClips.length === 0) return 120

    const maxEndTime = Math.max(...timelineClips.map((clip) => clip.startTime + clip.duration))
    return Math.max(maxEndTime + 30, 120) // Agregar 30 segundos de buffer
  }, [timelineClips])

  // Actualizar duración cuando cambien los clips
  useEffect(() => {
    const newDuration = calculateProjectDuration()
    setVideoDuration(newDuration)
  }, [timelineClips, calculateProjectDuration])

  const handleVideoUpload = useCallback((file: File) => {
    setIsLoading(true)
    setVideoFile(file)

    // Simular extracción de metadata del video
    setTimeout(() => {
      const mockMetadata: VideoMetadata = {
        filename: file.name,
        duration: 120, // 2 minutos
        fps: 30,
        resolution: "1920x1080",
        fileSize: 45.2, // MB
        codec: "H.264",
        bitrate: 5000,
        audioChannels: 2,
        audioSampleRate: 48000,
        createdAt: new Date().toLocaleDateString("es-ES"),
      }

      setVideoMetadata(mockMetadata)

      // Agregar el video a la biblioteca automáticamente
      const newMediaItem: MediaItem = {
        id: `media_${Date.now()}`,
        name: file.name,
        type: "video",
        duration: mockMetadata.duration,
        thumbnail: "/placeholder.svg?height=60&width=80",
        fileSize: mockMetadata.fileSize,
        dateAdded: new Date().toISOString().split("T")[0],
        file: file,
      }

      setMediaLibrary((prev) => [...prev, newMediaItem])

      // Agregar automáticamente a la timeline en la primera pista de video
      const newClip: TimelineClip = {
        id: `clip_${Date.now()}`,
        name: file.name,
        type: "video",
        startTime: 0,
        duration: mockMetadata.duration,
        trackIndex: 0, // Primera pista de video
        color: getClipColor("video", 0),
        thumbnail: "/placeholder.svg?height=40&width=60",
        mediaId: newMediaItem.id,
        locked: false,
        muted: false,
        visible: true,
        originalDuration: mockMetadata.duration,
        trimStart: 0,
        trimEnd: mockMetadata.duration,
      }

      setTimelineClips([newClip])
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleSeekTo = useCallback((time: number) => {
    setCurrentTime(time)
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
        setTimelineClips(prev => prev.map(clip => {
          if (clip.type === 'video' && clip.mediaId !== 'subtitle') {
            return {
              ...clip,
              startTime: Math.max(0, clip.startTime - data.startTime),
              duration: Math.min(clip.duration, data.newDuration),
              trimStart: data.startTime,
              trimEnd: data.endTime,
            }
          }
          return clip
        }))
        // Update video duration
        setVideoDuration(data.newDuration + 30)
        if (videoMetadata) {
          setVideoMetadata({
            ...videoMetadata,
            duration: data.newDuration
          })
        }
        break
        
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
        }
        setTimelineClips(prev => [...prev, transitionClip])
        break
        
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
  }, [videoDuration, videoMetadata])

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
          <div className="flex-1 p-6 overflow-hidden">
            {!videoFile ? (
              <VideoUploadArea onVideoUpload={handleVideoUpload} />
            ) : isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-white">Procesando video y extrayendo metadata...</p>
                </div>
              </div>
            ) : (
              <VideoPlayer
                videoFile={videoFile}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
              />
            )}
          </div>

          {/* Multi-Track Timeline */}
          <div className="h-64 border-t border-gray-700 overflow-hidden">
            <MultiTrackTimeline
              duration={videoDuration}
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
