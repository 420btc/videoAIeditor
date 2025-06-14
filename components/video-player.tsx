"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
// import { TextOverlayRenderer } from "./text-overlay-renderer" // Removed
// import { TextOverlay } from "@/types/text-overlay" // Removed

interface VideoPlayerProps {
  videoFile: File | null // Allow null for initial state
  isPlaying: boolean
  currentTime: number
  onTimeUpdate: (time: number) => void
  videoDuration: number // Added from VideoEditor
}

export function VideoPlayer({ 
  videoFile, 
  isPlaying, 
  currentTime, 
  onTimeUpdate,
  videoDuration
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const isSeekingRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return // Don't run if no video or no url

    const handleTimeUpdate = () => {
      if (!isSeekingRef.current) {
        onTimeUpdate(video.currentTime)
      }
    }

    const handleLoadedMetadata = () => {
      // Ensure video duration is properly set
      onTimeUpdate(0)
      // Update video dimensions for text overlay positioning
      setVideoDimensions({
        width: video.videoWidth,
        height: video.videoHeight
      })
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
    if (videoFile) {
      const newUrl = URL.createObjectURL(videoFile);
      setVideoUrl(newUrl);
      console.log("VideoPlayer: New object URL created:", newUrl, "for file:", videoFile.name);

      return () => {
        console.log("VideoPlayer: Revoking object URL:", newUrl);
        URL.revokeObjectURL(newUrl);
        setVideoUrl(null); // Clear the URL state
      };
    } else {
      // If videoFile becomes null, revoke any existing URL and clear it
      if (videoUrl) {
        console.log("VideoPlayer: videoFile is null, revoking:", videoUrl);
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
    }
  }, [videoFile]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return; // Don't run if no video or no url

    // When videoUrl changes, update the src and load
    video.src = videoUrl;
    video.load(); // Explicitly load the new source
    console.log("VideoPlayer: video.src set to", videoUrl, "and video.load() called");

    // Attempt to play if isPlaying is true after src is set
    if (isPlaying) {
      video.play().catch(error => console.error("Error playing video on src change:", error));
    }

  }, [videoUrl]); // Depends on videoUrl now


  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return // Don't run if no video or no url

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

  // Update container dimensions when video loads or resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setVideoDimensions({
          width: rect.width,
          height: rect.height
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return (
    <Card className="h-full bg-black border-gray-700 overflow-hidden">
      <div ref={containerRef} className="relative w-full h-full">
        <video 
          ref={videoRef} 
          // src is now set via useEffect when videoUrl changes
          className="w-full h-full object-contain" 
          controls={false} // Consider adding controls for debugging if issues persist
          preload="metadata"
          // onLoadedData={() => console.log('VideoPlayer: onLoadedData event')} // Debugging event
          // onError={(e) => console.error('VideoPlayer: video element error', e)} // Debugging event
        />
        
        {/* Text Overlays Removed */}
      </div>
    </Card>
  )
}
