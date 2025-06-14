"use client"

import React from 'react'
import { TextOverlay } from '@/types/text-overlay'

interface TextOverlayRendererProps {
  textOverlays: TextOverlay[]
  currentTime: number
  videoWidth: number
  videoHeight: number
  selectedTextId?: string
  onSelectText?: (id: string) => void
}

export function TextOverlayRenderer({
  textOverlays,
  currentTime,
  videoWidth,
  videoHeight,
  selectedTextId,
  onSelectText
}: TextOverlayRendererProps) {
  // Filtrar textos que deben ser visibles en el tiempo actual
  const visibleTexts = textOverlays.filter(text => {
    const isVisible = currentTime >= text.startTime && currentTime <= text.startTime + text.duration
    return isVisible
  })

  // Ordenar por layer (z-index)
  const sortedTexts = visibleTexts.sort((a, b) => a.layer - b.layer)

  const getAnimationStyle = (text: TextOverlay) => {
    if (!text.animation || text.animation.type === 'none') return {}

    const timeInText = currentTime - text.startTime
    const animationDuration = text.animation.duration || 0.5
    
    switch (text.animation.type) {
      case 'fadeIn':
        if (timeInText <= animationDuration) {
          const opacity = (timeInText / animationDuration) * text.style.opacity
          return { opacity: Math.max(0, Math.min(opacity, text.style.opacity)) }
        }
        break
      
      case 'fadeOut':
        const timeUntilEnd = (text.startTime + text.duration) - currentTime
        if (timeUntilEnd <= animationDuration) {
          const opacity = (timeUntilEnd / animationDuration) * text.style.opacity
          return { opacity: Math.max(0, Math.min(opacity, text.style.opacity)) }
        }
        break
      
      case 'slideIn':
        if (timeInText <= animationDuration) {
          const progress = timeInText / animationDuration
          const direction = text.animation.direction || 'left'
          
          switch (direction) {
            case 'left':
              return { transform: `translateX(${-100 + (progress * 100)}%)` }
            case 'right':
              return { transform: `translateX(${100 - (progress * 100)}%)` }
            case 'top':
              return { transform: `translateY(${-100 + (progress * 100)}%)` }
            case 'bottom':
              return { transform: `translateY(${100 - (progress * 100)}%)` }
          }
        }
        break
      
      case 'slideOut':
        const timeUntilEndSlide = (text.startTime + text.duration) - currentTime
        if (timeUntilEndSlide <= animationDuration) {
          const progress = 1 - (timeUntilEndSlide / animationDuration)
          const direction = text.animation.direction || 'left'
          
          switch (direction) {
            case 'left':
              return { transform: `translateX(${-progress * 100}%)` }
            case 'right':
              return { transform: `translateX(${progress * 100}%)` }
            case 'top':
              return { transform: `translateY(${-progress * 100}%)` }
            case 'bottom':
              return { transform: `translateY(${progress * 100}%)` }
          }
        }
        break
      
      case 'typewriter':
        if (timeInText <= animationDuration) {
          const progress = timeInText / animationDuration
          const visibleChars = Math.floor(text.content.length * progress)
          return { 
            content: text.content.substring(0, visibleChars),
            borderRight: progress < 1 ? '2px solid currentColor' : 'none'
          }
        }
        break
    }
    
    return {}
  }

  const getTextStyle = (text: TextOverlay) => {
    const animationStyle = getAnimationStyle(text)
    const isTypewriter = text.animation?.type === 'typewriter'
    
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${text.position.x}%`,
      top: `${text.position.y}%`,
      transform: 'translate(-50%, -50%)',
      fontSize: `${text.style.fontSize}px`,
      fontFamily: text.style.fontFamily,
      color: text.style.color,
      opacity: text.style.opacity,
      fontWeight: text.style.bold ? 'bold' : 'normal',
      fontStyle: text.style.italic ? 'italic' : 'normal',
      textDecoration: text.style.underline ? 'underline' : 'none',
      textAlign: text.style.textAlign,
      backgroundColor: text.style.backgroundColor || 'transparent',
      padding: text.style.backgroundColor ? '8px 16px' : '0',
      borderRadius: text.style.backgroundColor ? '4px' : '0',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      maxWidth: '80%',
      zIndex: text.layer + 1000,
      cursor: onSelectText ? 'pointer' : 'default',
      userSelect: 'none',
      pointerEvents: onSelectText ? 'auto' : 'none',
      // Stroke/outline
      WebkitTextStroke: text.style.strokeWidth && text.style.strokeColor 
        ? `${text.style.strokeWidth}px ${text.style.strokeColor}` 
        : 'none',
      textShadow: text.style.strokeWidth && text.style.strokeColor
        ? `0 0 ${text.style.strokeWidth * 2}px ${text.style.strokeColor}`
        : 'none',
      // Animation styles
      ...animationStyle,
      transition: 'all 0.1s ease-out'
    }

    // Agregar borde si está seleccionado
    if (selectedTextId === text.id) {
      baseStyle.outline = '2px solid #3b82f6'
      baseStyle.outlineOffset = '4px'
    }

    return baseStyle
  }

  if (sortedTexts.length === 0) return null

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        width: videoWidth,
        height: videoHeight,
        zIndex: 10, // Ensure overlays are stacked above the video
        backgroundColor: 'transparent' // Ensure container is transparent
      }}
    >
      {sortedTexts.map(text => {
        const animationStyle = getAnimationStyle(text)
        const isTypewriter = text.animation?.type === 'typewriter'
        const displayContent = isTypewriter && animationStyle.content 
          ? animationStyle.content 
          : text.content

        return (
          <div
            key={text.id}
            style={getTextStyle(text)}
            onClick={() => onSelectText?.(text.id)}
            className={`
              ${onSelectText ? 'hover:opacity-80' : ''}
              ${selectedTextId === text.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
            `}
          >
            {displayContent}
            {/* Cursor parpadeante para efecto typewriter */}
            {isTypewriter && animationStyle.borderRight && (
              <span 
                style={{ 
                  borderRight: animationStyle.borderRight,
                  animation: 'blink 1s infinite'
                }}
              />
            )}
          </div>
        )
      })}
      
      {/* CSS para animación de parpadeo del cursor */}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
