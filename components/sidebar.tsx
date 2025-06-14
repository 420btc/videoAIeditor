"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronDown,
  ChevronRight,
  Settings,
  Info,
  Clock,
  FolderOpen,
  Play,
  Plus,
  FileVideo,
  ImageIcon,
  Music,
  Trash2,
  Eye,
  Upload,
} from "lucide-react"

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

interface Chapter {
  id: string
  title: string
  startTime: number
  endTime: number
  thumbnail?: string
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

interface SidebarProps {
  videoMetadata?: VideoMetadata
  onSeekTo: (time: number) => void
  mediaLibrary: MediaItem[]
  onDeleteMedia: (mediaId: string) => void
  onImportMedia: () => void
}

export function Sidebar({ videoMetadata, onSeekTo, mediaLibrary, onDeleteMedia, onImportMedia }: SidebarProps) {
  const [isVideoInfoOpen, setIsVideoInfoOpen] = useState(true)
  const [isChaptersOpen, setIsChaptersOpen] = useState(true)
  const [isLibraryOpen, setIsLibraryOpen] = useState(true) // Abierto por defecto
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false)

  // Capítulos vacíos por defecto
  const chapters: Chapter[] = []

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatFileSize = (mb: number) => {
    return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${mb.toFixed(1)} MB`
  }

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "video":
        return <FileVideo className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      default:
        return <FileVideo className="h-4 w-4" />
    }
  }

  const handleDeleteMedia = (mediaId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm("¿Estás seguro de que quieres eliminar este archivo? También se eliminará de la timeline.")) {
      onDeleteMedia(mediaId)
    }
  }

  const filterMediaByType = (type: string) => {
    if (type === "all") return mediaLibrary
    return mediaLibrary.filter((item) => item.type === type)
  }

  // Drag handlers for media items
  const handleDragStart = (e: React.DragEvent, mediaItem: MediaItem) => {
    e.dataTransfer.setData("text/plain", mediaItem.id)
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div className="w-80 bg-gray-900/30 border-r border-gray-800 flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Información del Video */}
        <Card className="bg-gray-900/50 border-gray-700">
          <Collapsible open={isVideoInfoOpen} onOpenChange={setIsVideoInfoOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 text-white hover:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Información del Video</span>
                </div>
                {isVideoInfoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              {videoMetadata ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400">Archivo:</span>
                      <p className="text-white font-medium truncate">{videoMetadata.filename}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Duración:</span>
                      <p className="text-white font-medium">{formatTime(videoMetadata.duration)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400">Resolución:</span>
                      <p className="text-white font-medium">{videoMetadata.resolution}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">FPS:</span>
                      <p className="text-white font-medium">{videoMetadata.fps}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400">Codec:</span>
                      <p className="text-white font-medium">{videoMetadata.codec}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Bitrate:</span>
                      <p className="text-white font-medium">{videoMetadata.bitrate} kbps</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400">Tamaño:</span>
                      <p className="text-white font-medium">{formatFileSize(videoMetadata.fileSize)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Audio:</span>
                      <p className="text-white font-medium">
                        {videoMetadata.audioChannels}ch, {videoMetadata.audioSampleRate}Hz
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-400">Creado:</span>
                    <p className="text-white font-medium">{videoMetadata.createdAt}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">No hay video cargado</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Navegación por Capítulos */}
        <Card className="bg-gray-900/50 border-gray-700">
          <Collapsible open={isChaptersOpen} onOpenChange={setIsChaptersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 text-white hover:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Capítulos</span>
                  <Badge variant="secondary" className="text-xs">
                    {chapters.length}
                  </Badge>
                </div>
                {isChaptersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-2">
                {chapters.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm italic">No hay capítulos</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Los capítulos aparecerán aquí cuando agregues marcadores
                    </p>
                  </div>
                ) : (
                  chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => onSeekTo(chapter.startTime)}
                    >
                      <img
                        src={chapter.thumbnail || "/placeholder.svg"}
                        alt={chapter.title}
                        className="w-12 h-9 object-cover rounded border border-gray-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{chapter.title}</p>
                        <p className="text-gray-400 text-xs">
                          {formatTime(chapter.startTime)} - {formatTime(chapter.endTime)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSeekTo(chapter.startTime)
                        }}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs border-gray-600 text-gray-300 hover:text-white"
                  disabled={!videoMetadata}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar Capítulo
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Biblioteca de Medios */}
        <Card className="bg-gray-900/50 border-gray-700">
          <Collapsible open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 text-white hover:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-4 w-4" />
                  <span>Biblioteca</span>
                  <Badge variant="secondary" className="text-xs">
                    {mediaLibrary.length}
                  </Badge>
                </div>
                {isLibraryOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-2">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-800 h-8">
                    <TabsTrigger value="all" className="text-xs">
                      Todo
                    </TabsTrigger>
                    <TabsTrigger value="video" className="text-xs">
                      Video
                    </TabsTrigger>
                    <TabsTrigger value="audio" className="text-xs">
                      Audio
                    </TabsTrigger>
                    <TabsTrigger value="image" className="text-xs">
                      Imagen
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-3">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {mediaLibrary.length === 0 ? (
                        <div className="text-center py-8">
                          <FolderOpen className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm">Biblioteca vacía</p>
                        </div>
                      ) : (
                        filterMediaByType("all").map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 cursor-grab active:cursor-grabbing transition-colors group"
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                          >
                            <img
                              src={item.thumbnail || "/placeholder.svg"}
                              alt={item.name}
                              className="w-10 h-8 object-cover rounded border border-gray-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-medium truncate">{item.name}</p>
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                {getMediaIcon(item.type)}
                                <span>{formatFileSize(item.fileSize)}</span>
                                {item.duration && <span>{formatTime(item.duration)}</span>}
                              </div>
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                                onClick={(e) => handleDeleteMedia(item.id, e)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Filtros por tipo de media */}
                  {["video", "audio", "image"].map((type) => (
                    <TabsContent key={type} value={type} className="mt-3">
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {filterMediaByType(type).length === 0 ? (
                          <div className="text-center py-6">
                            {getMediaIcon(type)}
                            <p className="text-gray-400 text-sm italic mt-2">
                              No hay archivos de {type === "video" ? "video" : type === "audio" ? "audio" : "imagen"}
                            </p>
                          </div>
                        ) : (
                          filterMediaByType(type).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 cursor-grab active:cursor-grabbing group"
                              draggable
                              onDragStart={(e) => handleDragStart(e, item)}
                            >
                              {item.type === "audio" ? (
                                <div className="w-10 h-8 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                                  <Music className="h-4 w-4 text-gray-400" />
                                </div>
                              ) : (
                                <img
                                  src={item.thumbnail || "/placeholder.svg"}
                                  alt={item.name}
                                  className="w-10 h-8 object-cover rounded border border-gray-600"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">{item.name}</p>
                                <p className="text-gray-400 text-xs">
                                  {item.duration && `${formatTime(item.duration)} • `}
                                  {formatFileSize(item.fileSize)}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDeleteMedia(item.id, e)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs border-gray-600 text-gray-300 hover:text-white"
                  onClick={onImportMedia}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Importar Medios
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Configuración del Proyecto */}
        <Card className="bg-gray-900/50 border-gray-700">
          <Collapsible open={isProjectSettingsOpen} onOpenChange={setIsProjectSettingsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 text-white hover:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </div>
                {isProjectSettingsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-gray-300 block mb-1">Resolución</label>
                  <select className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs">
                    <option>1920x1080 (HD)</option>
                    <option>3840x2160 (4K)</option>
                    <option>1280x720 (720p)</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">Frame Rate</label>
                  <select className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs">
                    <option>30 fps</option>
                    <option>60 fps</option>
                    <option>24 fps</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">Formato de Salida</label>
                  <select className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs">
                    <option>MP4 (H.264)</option>
                    <option>MOV (ProRes)</option>
                    <option>WebM (VP9)</option>
                  </select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </ScrollArea>
    </div>
  )
}
