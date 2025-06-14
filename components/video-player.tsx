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
  const isSeekingRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      if (!isSeekingRef.current) {
        onTimeUpdate(video.currentTime)
      }
    }

    const handleLoadedMetadata = () => {
      // Ensure video duration is properly set
      onTimeUpdate(0)
    }

    const handlePlay = () => {
      // Video started playing
    }

    const handlePause = () => {
      // Video was paused
    }

    const handleSeeked = () => {
      isSeekingRef.current = false
    }

    const handleSeeking = () => {
      isSeekingRef.current = true
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("seeked", handleSeeked)
    video.addEventListener("seeking", handleSeeking)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("seeked", handleSeeked)
      video.removeEventListener("seeking", handleSeeking)
    }
  }, [onTimeUpdate])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const playVideo = async () => {
      try {
        if (isPlaying) {
          await video.play()
        } else {
          video.pause()
        }
      } catch (error) {
        console.error("Error controlling video playback:", error)
      }
    }

    playVideo()
  }, [isPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    console.log('VideoPlayer currentTime effect triggered:', {
      currentTime,
      videoCurrentTime: video.currentTime,
      difference: Math.abs(video.currentTime - currentTime),
      isSeekingRef: isSeekingRef.current
    })

    // Only seek if the difference is significant and we're not already seeking
    if (!isSeekingRef.current && Math.abs(video.currentTime - currentTime) > 0.1) {
      console.log('VideoPlayer seeking to:', currentTime)
      isSeekingRef.current = true
      video.currentTime = currentTime
    }
  }, [currentTime])

  return (
    <Card className="h-full bg-black border-gray-700 overflow-hidden">
      <video 
        ref={videoRef} 
        src={videoUrl} 
        className="w-full h-full object-contain" 
        controls={false}
        preload="metadata"
      />
    </Card>
  )
}
