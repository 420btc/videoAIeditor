"use client"

import { useState, useCallback, useEffect } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, Settings, ChevronDown, ChevronRight, Eye, EyeOff, Loader2, Wrench } from "lucide-react"

interface AIAssistantPanelProps {
  onAIAction?: (action: string, data: any) => void
}

export function AIAssistantPanel({ onAIAction }: AIAssistantPanelProps) {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [savedApiKey, setSavedApiKey] = useState("")

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: {
      apiKey: savedApiKey,
    },
    onError: (error) => {
      console.error("Chat error:", error)
      // Handle specific error types
      if (error.message?.includes('timeout') || error.message?.includes('408')) {
        // Don't show the full error, just a user-friendly message
        return
      }
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "¡Hola! Soy tu asistente de edición de video con IA. Puedo ayudarte con tareas como agregar subtítulos, recortar videos, añadir transiciones, ajustar audio y mucho más. Para comenzar, configura tu API key de OpenAI en la configuración.",
      },
    ],
  })

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setSavedApiKey(apiKey.trim())
      localStorage.setItem("openai_api_key", apiKey.trim())
      alert("¡Clave API de OpenAI guardada exitosamente!")
    }
  }

  // Cargar API key guardada al montar el componente
  useEffect(() => {
    const saved = localStorage.getItem("openai_api_key")
    if (saved) {
      setSavedApiKey(saved)
      setApiKey(saved)
    }
  }, [])

  const renderMessage = (message: any) => {
    const isUser = message.role === "user"
    const isToolCall = message.toolInvocations && message.toolInvocations.length > 0

    return (
      <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[85%] space-y-2`}>
          {/* Mensaje principal */}
          {message.content && (
            <div
              className={`rounded-lg p-3 text-sm ${isUser ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"}`}
            >
              {message.content}
            </div>
          )}

          {/* Herramientas ejecutadas */}
          {isToolCall && (
            <div className="space-y-2">
              {message.toolInvocations.map((tool: any, index: number) => (
                <div key={index} className="bg-gray-700 rounded-lg p-3 text-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wrench className="h-4 w-4 text-blue-400" />
                    <Badge variant="secondary" className="text-xs">
                      {tool.toolName}
                    </Badge>
                    {tool.state === "call" && <Loader2 className="h-3 w-3 animate-spin text-blue-400" />}
                  </div>

                  {tool.state === "call" && <p className="text-gray-300 text-xs">Ejecutando: {tool.toolName}...</p>}

                  {tool.state === "result" && tool.result && (
                    <div className="space-y-1">
                      <p className="text-green-400 text-xs font-medium">✓ {tool.result.message}</p>
                      {tool.result.data && (
                        <pre className="text-xs text-gray-400 bg-gray-800 p-2 rounded overflow-x-auto">
                          {JSON.stringify(tool.result.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Procesar resultados de herramientas de IA
  const processToolResult = useCallback((toolName: string, result: any) => {
    if (!onAIAction) return

    switch (toolName) {
      case 'addSubtitles':
        onAIAction('subtitle_added', {
          text: result.text,
          startTime: result.startTime,
          endTime: result.endTime,
          position: result.position
        })
        break
      case 'trimVideo':
        onAIAction('video_trimmed', {
          startTime: result.startTime,
          endTime: result.endTime,
          newDuration: result.endTime - result.startTime
        })
        break
      case 'addTransition':
        onAIAction('transition_added', {
          type: result.type,
          position: result.position,
          duration: result.duration
        })
        break
      case 'adjustAudio':
        onAIAction('audio_adjusted', {
          action: result.action,
          value: result.value,
          startTime: result.startTime,
          endTime: result.endTime
        })
        break
      case 'generateThumbnail':
        onAIAction('thumbnail_generated', {
          url: result.url,
          timestamp: result.timestamp,
          style: result.style
        })
        break
      case 'analyzeVideo':
        onAIAction('video_analyzed', {
          results: result.results,
          type: result.type
        })
        break
    }
  }, [onAIAction])

  // Monitor tool calls and process results
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant' && lastMessage.toolInvocations) {
        lastMessage.toolInvocations.forEach((toolCall: any) => {
          if (toolCall.state === 'result' && toolCall.result) {
            processToolResult(toolCall.toolName, toolCall.result)
          }
        })
      }
    }
  }, [messages, processToolResult])

  return (
    <div className="w-96 bg-gray-900/30 border-l border-gray-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-white">Asistente IA</h3>
          </div>
          {savedApiKey && (
            <Badge variant="outline" className="text-xs text-green-400 border-green-400">
              API Conectada
            </Badge>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/20 border-b border-red-800 flex-shrink-0">
          <p className="text-red-400 text-sm">
            {error.message?.includes('timeout') || error.message?.includes('408') 
              ? "La solicitud tardó demasiado. Intenta con una tarea más simple."
              : error.message?.includes('401') || error.message?.includes('API key')
              ? "Clave API inválida. Verifica tu configuración."
              : error.message?.includes('500')
              ? "Error del servidor. Intenta nuevamente en unos momentos."
              : `Error: ${error.message}`
            }
          </p>
        </div>
      )}

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex-shrink-0">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key de OpenAI
              </label>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10 bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSaveApiKey} size="sm" className="flex-1">
                Guardar
              </Button>
              <Button onClick={() => setIsSettingsOpen(false)} variant="outline" size="sm">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">¡Hola! Soy tu asistente de edición de video.</p>
            <p className="text-xs mt-2">Puedo ayudarte a editar videos, agregar subtítulos, recortar clips y más.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-100"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === "assistant" && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  {message.role === "user" && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    
                    {/* Tool Invocations */}
                    {message.toolInvocations && message.toolInvocations.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.toolInvocations.map((toolInvocation, index) => (
                          <div key={index} className="bg-gray-800/50 rounded p-2 border border-gray-600">
                            <div className="flex items-center space-x-2 mb-1">
                              <Wrench className="h-3 w-3" />
                              <span className="text-xs font-medium">{toolInvocation.toolName}</span>
                              {toolInvocation.state === 'result' && (
                                <Badge variant="outline" className="text-xs">
                                  Completado
                                </Badge>
                              )}
                            </div>
                            {toolInvocation.state === 'result' && toolInvocation.result && (
                              <p className="text-xs text-gray-300">{toolInvocation.result.message}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Procesando...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0">
        {!savedApiKey ? (
          <div className="text-center">
            <Button
              onClick={() => setIsSettingsOpen(true)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar API Key
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Describe qué quieres hacer con tu video..."
                disabled={isLoading}
                className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <Button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <Settings className="h-3 w-3 mr-1" />
                Configuración
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
