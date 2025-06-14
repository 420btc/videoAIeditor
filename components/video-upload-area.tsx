"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, Video, FileVideo } from "lucide-react"

interface VideoUploadAreaProps {
  onVideoUpload: (file: File) => void
}

export function VideoUploadArea({ onVideoUpload }: VideoUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find((file) => file.type.startsWith("video/"))

    if (videoFile) {
      handleFileUpload(videoFile)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("video/")) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const simulateProgress = () => {
      return new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(interval)
              resolve()
              return 90
            }
            return prev + 10
          })
        }, 200)
      })
    }

    try {
      // Wait for progress simulation to complete
      await simulateProgress()

      // Complete the upload
      setUploadProgress(100)

      // Wait a moment before calling the callback
      setTimeout(() => {
        setIsUploading(false)
        onVideoUpload(file)
      }, 300)
    } catch (error) {
      console.error("Upload failed:", error)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card
      className={`
        h-full flex items-center justify-center p-8 border-2 border-dashed transition-all duration-200
        ${isDragOver ? "border-blue-500 bg-blue-500/10" : "border-gray-600 bg-gray-900/50 hover:border-gray-500"}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <div className="flex flex-col items-center space-y-4 w-full max-w-md">
          <FileVideo className="h-16 w-16 text-blue-500 animate-pulse" />
          <div className="w-full space-y-2">
            <p className="text-white font-medium text-center">Uploading video...</p>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-gray-400 text-center">{uploadProgress}% complete</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6">
          <Video className="h-16 w-16 text-gray-400" />
          
          <div className="flex flex-col items-center space-y-2">
            <h3 className="text-lg font-medium text-white">Upload Video</h3>
            <p className="text-gray-400">Drag & drop or click to browse</p>
          </div>

          <div className="flex flex-col items-center">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => document.getElementById("video-upload")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <input 
              id="video-upload" 
              type="file" 
              accept="video/*" 
              className="sr-only" 
              onChange={handleFileSelect} 
            />
          </div>
        </div>
      )}
    </Card>
  )
}
