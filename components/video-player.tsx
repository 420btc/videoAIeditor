"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"

interface VideoPlayerProps {
  videoFile: File
  isPlaying: boolean
  currentTime: number
  onTimeUpdate: (time: number) => void
}

export function VideoPlayer({ videoFile, isPlaying, currentTime, onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoUrl = URL.createObjectURL(videoFile)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    return () => video.removeEventListener("timeupdate", handleTimeUpdate)
  }, [onTimeUpdate])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.play()
    } else {
      video.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime
    }
  }, [currentTime])

  return (
    <Card className="h-full bg-black border-gray-700 overflow-hidden">
      <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" controls={false} />
    </Card>
  )
}
