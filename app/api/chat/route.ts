import { openai } from "@ai-sdk/openai"
import { streamText, tool } from "ai"
import { z } from "zod"

// Herramientas de edición de video disponibles para el agente
const videoEditingTools = {
  addSubtitles: tool({
    description: 'Add subtitles or text overlays to the video at specific timestamps',
    parameters: z.object({
      text: z.string().describe('The subtitle text to add'),
      startTime: z.number().describe('Start time in seconds'),
      endTime: z.number().describe('End time in seconds'),
      position: z.enum(['top', 'center', 'bottom']).describe('Position of the subtitle')
    }),
    execute: async ({ text, startTime, endTime, position }) => {
      // This will trigger the real video processing in the frontend
      return {
        success: true,
        text,
        startTime,
        endTime,
        position,
        message: `Subtitle "${text}" added from ${startTime}s to ${endTime}s at ${position} position`,
        requiresProcessing: true // Flag to indicate this needs real processing
      }
    }
  }),

  trimVideo: tool({
    description: 'Trim or cut the video to a specific time range',
    parameters: z.object({
      startTime: z.number().describe('Start time in seconds for the trim'),
      endTime: z.number().describe('End time in seconds for the trim')
    }),
    execute: async ({ startTime, endTime }) => {
      // This will trigger the real video processing in the frontend
      return {
        success: true,
        startTime,
        endTime,
        newDuration: endTime - startTime,
        message: `Video trimmed from ${startTime}s to ${endTime}s (duration: ${endTime - startTime}s)`,
        requiresProcessing: true // Flag to indicate this needs real processing
      }
    }
  }),

  addTransition: tool({
    description: 'Add transition effects between video segments',
    parameters: z.object({
      type: z.enum(['fade', 'dissolve', 'wipe', 'slide']).describe('Type of transition'),
      position: z.number().describe('Position in seconds where to add the transition'),
      duration: z.number().describe('Duration of the transition in seconds')
    }),
    execute: async ({ type, position, duration }) => {
      await new Promise(resolve => setTimeout(resolve, 600))
      return {
        success: true,
        type,
        position,
        duration,
        message: `${type} transition added at ${position}s with ${duration}s duration`
      }
    }
  }),

  adjustAudio: tool({
    description: 'Adjust audio levels, add background music, or reduce noise',
    parameters: z.object({
      action: z.enum(['volume', 'background_music', 'noise_reduction']).describe('Type of audio adjustment'),
      value: z.number().describe('Adjustment value (0-100 for volume, etc.)'),
      startTime: z.number().optional().describe('Start time for the adjustment'),
      endTime: z.number().optional().describe('End time for the adjustment')
    }),
    execute: async ({ action, value, startTime, endTime }) => {
      // This will trigger the real video processing in the frontend
      return {
        success: true,
        action,
        value,
        startTime: startTime || 0,
        endTime: endTime || 0,
        message: `Audio ${action} adjusted to ${value}${startTime ? ` from ${startTime}s to ${endTime}s` : ''}`,
        requiresProcessing: true // Flag to indicate this needs real processing
      }
    }
  }),

  generateThumbnail: tool({
    description: 'Generate thumbnails from video frames',
    parameters: z.object({
      timestamp: z.number().describe('Timestamp in seconds to capture the thumbnail'),
      style: z.enum(['original', 'enhanced', 'artistic']).describe('Style of the thumbnail')
    }),
    execute: async ({ timestamp, style }) => {
      await new Promise(resolve => setTimeout(resolve, 400))
      return {
        success: true,
        url: `/api/thumbnails/thumb_${timestamp}_${style}.jpg`,
        timestamp,
        style,
        message: `${style} thumbnail generated at ${timestamp}s`
      }
    }
  }),

  analyzeVideo: tool({
    description: 'Analyze video content for scenes, objects, speech, or emotions',
    parameters: z.object({
      type: z.enum(['scenes', 'objects', 'speech', 'emotions']).describe('Type of analysis to perform')
    }),
    execute: async ({ type }) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockResults = {
        scenes: ['intro scene (0-10s)', 'main content (10-45s)', 'outro (45-60s)'],
        objects: ['person', 'computer', 'desk', 'window'],
        speech: ['Hello everyone', 'Welcome to this tutorial', 'Thank you for watching'],
        emotions: ['neutral (0-20s)', 'happy (20-40s)', 'excited (40-60s)']
      }
      return {
        success: true,
        type,
        results: mockResults[type],
        message: `Video ${type} analysis completed`
      }
    }
  }),
}

export async function POST(req: Request) {
  try {
    // Add request timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000) // 25 second timeout
    })

    const { messages, apiKey, videoContext } = await req.json()

    if (!apiKey) {
      return Response.json({ error: "OpenAI API key is required" }, { status: 400 })
    }

    // Set the API key in environment for this request
    process.env.OPENAI_API_KEY = apiKey

    // Wrap the streamText call with timeout
    const resultPromise = streamText({
      model: openai("gpt-4"),
      messages,
      tools: videoEditingTools,
      system: `You are an AI video editing assistant with access to professional video editing tools. 

${videoContext ? `CURRENT VIDEO INFORMATION:
- Video Name: ${videoContext.videoName}
- File Size: ${videoContext.videoSize}
- Duration: ${videoContext.videoDuration}
- Current Time: ${videoContext.currentTime}
${videoContext.videoMetadata ? `- Resolution: ${videoContext.videoMetadata.resolution}
- Frame Rate: ${videoContext.videoMetadata.fps}
- Format: ${videoContext.videoMetadata.format}` : ''}

IMPORTANT: You are currently working with this video. When the user asks for edits like "cut the video in two parts" or "trim the video", you should be proactive and suggest reasonable cut points based on the video duration. For example, if the video is 60 seconds long, you could suggest cutting it at 30 seconds to create two equal parts. Don't ask for specific timestamps unless the user wants a custom cut point.

` : ''}
You can help users with:
- Adding subtitles and captions
- Trimming and cutting video segments  
- Adding transitions and effects
- Adjusting audio levels and adding background music
- Generating thumbnails
- Analyzing video content

When a user requests video editing tasks, use the appropriate tools to perform the actions. Always explain what you're doing and provide updates on the progress.

You have access to these tools:
- addSubtitles: Add text overlays at specific times
- trimVideo: Cut video to specific time ranges
- addTransition: Add transition effects between segments
- adjustAudio: Modify audio levels and add effects
- generateThumbnail: Create thumbnails from video frames
- analyzeVideo: Analyze video content for various elements

Be proactive in suggesting improvements and ask clarifying questions when needed.
Keep responses concise and focus on the specific editing task requested.`,
      maxSteps: 3,
    })

    const result = await Promise.race([resultPromise, timeoutPromise])
    return (result as any).toDataStreamResponse()
  } catch (error: any) {
    console.error("Chat API error:", error)
    
    // More specific error handling
    if (error.message === 'Request timeout') {
      return Response.json({ error: "Request timed out. Please try a simpler request." }, { status: 408 })
    }
    
    if (error.message?.includes('API key')) {
      return Response.json({ error: "Invalid OpenAI API key" }, { status: 401 })
    }
    
    return Response.json({ 
      error: "Failed to process request. Please try again.", 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 })
  }
}
