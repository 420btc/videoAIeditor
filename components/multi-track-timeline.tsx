"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Scissors,
  Copy,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Square,
} from "lucide-react"

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
  originalDuration?: number // Duración original del archivo
  trimStart?: number // Tiempo de inicio del recorte
  trimEnd?: number // Tiempo de fin del recorte
}

interface Track {
  id: string
  name: string
  type: "video" | "audio"
  height: number
  muted: boolean
  visible: boolean
  locked: boolean
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

interface MultiTrackTimelineProps {
  duration: number
  currentTime: number
  isPlaying: boolean
  onTimeChange: (time: number) => void
  onPlayPause: () => void
  clips: TimelineClip[]
  onDeleteClip: (clipId: string) => void
  onDropToTimeline: (mediaItem: MediaItem, trackIndex: number, dropTime: number) => void
  onMoveClip: (clipId: string, newStartTime: number, newTrackIndex?: number) => void
  onResizeClip: (clipId: string, newDuration: number, resizeStart?: boolean) => void
  onSplitClip: (clipId: string, splitTime: number) => void
  onUpdateClips: (clips: TimelineClip[]) => void
  mediaLibrary: MediaItem[]
}

export function MultiTrackTimeline({
  duration,
  currentTime,
  isPlaying,
  onTimeChange,
  onPlayPause,
  clips,
  onDeleteClip,
  onDropToTimeline,
  onMoveClip,
  onResizeClip,
  onSplitClip,
  onUpdateClips,
  mediaLibrary,
}: MultiTrackTimelineProps) {
  const [zoom, setZoom] = useState(1)
  const [selectedClip, setSelectedClip] = useState<string | null>(null)
  const [draggedClip, setDraggedClip] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizingClip, setResizingClip] = useState<{ clipId: string; side: "left" | "right" } | null>(null)
  const [cutMode, setCutMode] = useState(false)
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  const [tracks] = useState<Track[]>([
    { id: "v1", name: "Video 1", type: "video", height: 60, muted: false, visible: true, locked: false },
    { id: "v2", name: "Video 2", type: "video", height: 60, muted: false, visible: true, locked: false },
    { id: "a1", name: "Audio 1", type: "audio", height: 40, muted: false, visible: true, locked: false },
    { id: "a2", name: "Audio 2", type: "audio", height: 40, muted: false, visible: true, locked: false },
  ])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const pixelsPerSecond = 5 * zoom
  const timelineWidth = Math.max(duration * pixelsPerSecond, 800)

  const getClipWidth = (clipDuration: number) => clipDuration * pixelsPerSecond
  const getClipPosition = (startTime: number) => startTime * pixelsPerSecond
  const getTimeFromPosition = (position: number) => position / pixelsPerSecond

  // Calcular la duración real del proyecto basada en los clips
  const calculateProjectDuration = useCallback(() => {
    if (clips.length === 0) return 120 // Duración mínima

    const maxEndTime = Math.max(...clips.map((clip) => clip.startTime + clip.duration))
    return Math.max(maxEndTime + 30, 120) // Agregar 30 segundos de buffer
  }, [clips])

  const allClips = clips // Use only real clips, no filler

  const handleClipClick = (clipId: string) => {
    setSelectedClip(clipId)
  }

  const handleDeleteSelectedClip = () => {
    if (selectedClip) {
      onDeleteClip(selectedClip)
      setSelectedClip(null)
    }
  }

  const handleSplitSelectedClip = () => {
    if (selectedClip) {
      onSplitClip(selectedClip, currentTime)
    }
  }

  const handleCutAtPlayhead = () => {
    // Encontrar clips que intersectan con el playhead
    const clipsAtPlayhead = clips.filter(
      (clip) =>
        currentTime >= clip.startTime &&
        currentTime <= clip.startTime + clip.duration &&
        !clip.locked &&
        clip.mediaId !== "filler",
    )

    clipsAtPlayhead.forEach((clip) => {
      onSplitClip(clip.id, currentTime)
    })
  }

  // Playhead drag handlers
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDraggingPlayhead(true)
    e.preventDefault()
  }, [])

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (timelineRef.current && !isDraggingPlayhead) {
        const rect = timelineRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left - 132 // Restar ancho del header
        const newTime = Math.max(0, Math.min(duration, getTimeFromPosition(clickX)))
        console.log('MultiTrackTimeline handleTimelineClick - clicking to time:', newTime)
        onTimeChange(newTime)
      }
    },
    [duration, onTimeChange, isDraggingPlayhead],
  )

  // Drag and Drop handlers
  const handleClipMouseDown = useCallback(
    (e: React.MouseEvent, clipId: string) => {
      if (e.button !== 0) return // Solo botón izquierdo
      if (clipId.startsWith("filler_")) return // No arrastrar clips de relleno

      const clip = clips.find((c) => c.id === clipId)
      if (!clip || clip.locked) return

      const rect = e.currentTarget.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      setDraggedClip(clipId)
      setDragOffset({ x: offsetX, y: offsetY })
      setSelectedClip(clipId)

      e.preventDefault()
      e.stopPropagation()
    },
    [clips],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDraggingPlayhead && timelineRef.current) {
        const timelineRect = timelineRef.current.getBoundingClientRect()
        const newX = e.clientX - timelineRect.left - 132 // Restar ancho del header
        const newTime = Math.max(0, Math.min(duration, getTimeFromPosition(newX)))
        console.log('MultiTrackTimeline handleMouseMove - dragging playhead to time:', newTime)
        onTimeChange(newTime)
      }

      if (draggedClip && timelineRef.current) {
        const timelineRect = timelineRef.current.getBoundingClientRect()
        const newX = e.clientX - timelineRect.left - 132 - dragOffset.x
        const newY = e.clientY - timelineRect.top - dragOffset.y

        const newStartTime = Math.max(0, getTimeFromPosition(newX))

        // Determinar nueva pista basada en la posición Y
        const headerHeight = 30 // Altura del header de tiempo
        const trackY = newY - headerHeight
        const newTrackIndex = Math.max(0, Math.min(tracks.length - 1, Math.floor(trackY / tracks[0].height)))

        onMoveClip(draggedClip, newStartTime, newTrackIndex)
      }

      if (resizingClip && timelineRef.current) {
        const timelineRect = timelineRef.current.getBoundingClientRect()
        const clip = clips.find((c) => c.id === resizingClip.clipId)
        if (!clip) return

        const mouseX = e.clientX - timelineRect.left - 132
        const mouseTime = getTimeFromPosition(mouseX)

        if (resizingClip.side === "right") {
          const newDuration = Math.max(0.1, mouseTime - clip.startTime)
          onResizeClip(resizingClip.clipId, newDuration)
        } else {
          const newDuration = Math.max(0.1, clip.startTime + clip.duration - mouseTime)
          onResizeClip(resizingClip.clipId, newDuration, true)
        }
      }
    },
    [
      isDraggingPlayhead,
      draggedClip,
      dragOffset,
      onMoveClip,
      resizingClip,
      clips,
      onResizeClip,
      tracks,
      duration,
      onTimeChange,
    ],
  )

  const handleMouseUp = useCallback(() => {
    setDraggedClip(null)
    setResizingClip(null)
    setIsDraggingPlayhead(false)
    setDragOffset({ x: 0, y: 0 })
  }, [])

  // Agregar event listeners
  useEffect(() => {
    if (draggedClip || resizingClip || isDraggingPlayhead) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [draggedClip, resizingClip, isDraggingPlayhead, handleMouseMove, handleMouseUp])

  // Handle resize
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, clipId: string, side: "left" | "right") => {
    e.stopPropagation()
    setResizingClip({ clipId, side })
  }, [])

  // Handle drop from library
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const mediaId = e.dataTransfer.getData("text/plain")
      const mediaItem = mediaLibrary.find((item) => item.id === mediaId)

      if (mediaItem && timelineRef.current) {
        const timelineRect = timelineRef.current.getBoundingClientRect()
        const dropX = e.clientX - timelineRect.left - 132 // Restar ancho del header
        const dropTime = Math.max(0, getTimeFromPosition(dropX))

        onDropToTimeline(mediaItem, 0, dropTime)
      }
    },
    [mediaLibrary, onDropToTimeline],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const renderTimeMarkers = () => {
    const markers = []
    const interval = zoom < 0.5 ? 30 : zoom < 1 ? 15 : zoom < 2 ? 10 : 5
    const maxTime = Math.max(duration, 120)

    for (let i = 0; i <= maxTime; i += interval) {
      markers.push(
        <div
          key={i}
          className="absolute top-0 bottom-0 border-l border-gray-600"
          style={{ left: `${i * pixelsPerSecond}px` }}
        >
          <span className="absolute -top-5 -left-4 text-xs text-gray-400 font-mono">{formatTime(i)}</span>
        </div>,
      )
    }
    return markers
  }

  const renderPlayhead = () => (
    <div
      className={`absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 ${
        isDraggingPlayhead ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ left: `${currentTime * pixelsPerSecond}px` }}
      onMouseDown={handlePlayheadMouseDown}
    >
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rotate-45 transform origin-center cursor-grab"></div>
      {/* Línea de corte extendida */}
      <div className="absolute top-6 bottom-0 w-0.5 bg-red-500 opacity-60 pointer-events-none"></div>
    </div>
  )

  return (
    <div className="h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
      {/* Timeline Controls */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white"
              onClick={() => onTimeChange(Math.max(0, currentTime - 10))}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={onPlayPause}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white"
              onClick={() => onTimeChange(Math.min(duration, currentTime + 10))}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="text-sm text-gray-400 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Zoom:</span>
              <Slider
                value={[zoom]}
                min={0.25}
                max={4}
                step={0.25}
                onValueChange={([value]) => setZoom(value)}
                className="w-20"
              />
              <span className="text-xs text-gray-400 w-8">{zoom}x</span>
            </div>

            <div className="flex space-x-1">
              <Button
                variant={cutMode ? "default" : "ghost"}
                size="sm"
                className={`${cutMode ? "bg-red-600 hover:bg-red-700" : "text-gray-400 hover:text-white"}`}
                onClick={() => setCutMode(!cutMode)}
              >
                <Scissors className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={handleCutAtPlayhead}
                disabled={clips.length === 0}
              >
                <Square className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" disabled={!selectedClip}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-red-400"
                disabled={!selectedClip}
                onClick={handleDeleteSelectedClip}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="flex-1 overflow-hidden">
        <div
          className="relative h-full overflow-auto"
          ref={timelineRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex">
            {/* Track Headers */}
            <div className="w-32 bg-gray-800/50 border-r border-gray-700 flex-shrink-0">
              {/* Time header space to align with time markers */}
              <div className="h-6 border-b border-gray-700 bg-gray-800/30"></div>
              
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between px-3 border-b border-gray-700"
                  style={{ height: `${track.height}px` }}
                >
                  <div className="flex items-center space-x-2">
                    <Badge variant={track.type === "video" ? "default" : "secondary"} className="text-xs px-1">
                      {track.type === "video" ? "V" : "A"}
                      {index + 1}
                    </Badge>
                    <span className="text-xs text-white truncate">{track.name}</span>
                  </div>

                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-5 w-5 p-0 ${track.visible ? "text-white" : "text-gray-500"}`}
                    >
                      {track.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-5 w-5 p-0 ${track.muted ? "text-red-400" : "text-white"}`}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-5 w-5 p-0 ${track.locked ? "text-yellow-400" : "text-gray-500"}`}
                    >
                      <Lock className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline Content */}
            <div
              className="flex-1 relative min-w-0"
              style={{ minWidth: `${timelineWidth}px` }}
              onClick={handleTimelineClick}
            >
              {/* Time Markers */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800/30 border-b border-gray-700">
                {renderTimeMarkers()}
              </div>

              {/* Tracks */}
              <div className="relative" style={{ marginTop: "24px" }}>
                {tracks.map((track, trackIndex) => (
                  <div
                    key={track.id}
                    className="relative border-b border-gray-700 bg-gray-900/20"
                    style={{ height: `${track.height}px` }}
                  >
                    {/* Empty track message */}
                    {clips.filter((clip) => clip.trackIndex === trackIndex).length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Plus className="h-4 w-4" />
                          <span className="text-xs">Arrastra archivos aquí</span>
                        </div>
                      </div>
                    )}

                    {/* Clips in this track */}
                    {clips
                      .filter((clip) => clip.trackIndex === trackIndex)
                      .map((clip) => (
                        <div
                          key={clip.id}
                          className={`absolute top-1 bottom-1 rounded transition-all duration-200 ${clip.color} ${
                            selectedClip === clip.id
                              ? "ring-2 ring-white ring-opacity-50 shadow-lg"
                              : "hover:brightness-110"
                          } ${draggedClip === clip.id ? "opacity-70" : ""} ${
                            clip.mediaId === "filler"
                              ? "cursor-default opacity-50"
                              : cutMode
                                ? "cursor-crosshair"
                                : "cursor-pointer"
                          }`}
                          style={{
                            left: `${getClipPosition(clip.startTime)}px`,
                            width: `${getClipWidth(clip.duration)}px`,
                          }}
                          onMouseDown={
                            clip.mediaId !== "filler" && !cutMode ? (e) => handleClipMouseDown(e, clip.id) : undefined
                          }
                          onClick={
                            cutMode && clip.mediaId !== "filler"
                              ? () => onSplitClip(clip.id, currentTime)
                              : () => handleClipClick(clip.id)
                          }
                        >
                          <div className="h-full flex items-center px-2 overflow-hidden">
                            {clip.thumbnail && clip.mediaId !== "filler" && (
                              <img
                                src={clip.thumbnail || "/placeholder.svg"}
                                alt={clip.name}
                                className="w-8 h-6 object-cover rounded mr-2 opacity-80"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-medium truncate">{clip.name}</p>
                              <p className="text-white/70 text-xs">{formatTime(clip.duration)}</p>
                            </div>
                          </div>

                          {/* Resize handles */}
                          {!cutMode && (
                            <>
                              <div
                                className="absolute left-0 top-0 bottom-0 w-2 bg-white/30 cursor-ew-resize opacity-0 hover:opacity-100"
                                onMouseDown={(e) => handleResizeMouseDown(e, clip.id, "left")}
                              ></div>
                              <div
                                className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 cursor-ew-resize opacity-0 hover:opacity-100"
                                onMouseDown={(e) => handleResizeMouseDown(e, clip.id, "right")}
                              ></div>
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>

              {/* Playhead */}
              {renderPlayhead()}
            </div>
          </div>
        </div>
      </div>

      {/* Clip Details */}
      {selectedClip && (
        <div className="p-4 border-t border-gray-700 bg-gray-800/30">
          {(() => {
            const clip = clips.find((c) => c.id === selectedClip)
            return clip ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{clip.name}</p>
                  <p className="text-gray-400 text-xs">
                    {formatTime(clip.startTime)} - {formatTime(clip.startTime + clip.duration)} (
                    {formatTime(clip.duration)})
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    Propiedades
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Efectos
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={handleSplitSelectedClip}>
                    Dividir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                    onClick={handleDeleteSelectedClip}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ) : null
          })()}
        </div>
      )}

      {/* Cut Mode Indicator */}
      {cutMode && (
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
          Modo Corte Activo - Click en clips para cortar
        </div>
      )}

      {/* Empty Timeline Message */}
      {clips.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-gray-400"></h3>
          </div>
        </div>
      )}
    </div>
  )
}
