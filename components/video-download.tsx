'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Download, FileVideo } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface VideoDownloadProps {
  videoFile: File | null
  isProcessing: boolean
  processingProgress: number
}

export function VideoDownload({ videoFile, isProcessing, processingProgress }: VideoDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!videoFile) return

    try {
      setIsDownloading(true)
      
      // Create download link
      const url = URL.createObjectURL(videoFile)
      const link = document.createElement('a')
      link.href = url
      link.download = videoFile.name || 'edited-video.mp4'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the URL object
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error downloading video:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="w-full bg-gray-900 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <FileVideo className="h-4 w-4" />
          Exportar Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Procesando...</span>
              <span>{Math.round(processingProgress * 100)}%</span>
            </div>
            <Progress value={processingProgress * 100} className="w-full h-2" />
          </div>
        )}
        
        {videoFile && !isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-800 border border-gray-600 rounded">
              <div className="min-w-0 flex-1 mr-2">
                <p className="font-medium text-white text-xs truncate">{videoFile.name}</p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(videoFile.size)}
                </p>
              </div>
              <Button 
                onClick={handleDownload}
                disabled={isDownloading}
                size="sm"
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-7"
              >
                <Download className="h-3 w-3" />
                {isDownloading ? 'Descargando...' : 'Descargar'}
              </Button>
            </div>
            
            <div className="text-xs text-gray-400 space-y-1">
              <p>• Procesado en tu navegador</p>
              <p>• Sin envío de datos externos</p>
            </div>
          </div>
        )}
        
        {!videoFile && !isProcessing && (
          <div className="text-center py-4 text-gray-400">
            <FileVideo className="h-8 w-8 mx-auto mb-1 opacity-50" />
            <p className="text-xs">No hay video listo</p>
            <p className="text-xs">Sube y edita un video</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}