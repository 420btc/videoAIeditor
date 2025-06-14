"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scissors, Type, Volume2, Zap, Search } from "lucide-react"

interface VideoEditingToolsProps {
  onToolUse: (tool: string, params: any) => void
}

export function VideoEditingTools({ onToolUse }: VideoEditingToolsProps) {
  const [subtitleText, setSubtitleText] = useState("")
  const [subtitleStart, setSubtitleStart] = useState("")
  const [subtitleEnd, setSubtitleEnd] = useState("")
  const [trimStart, setTrimStart] = useState("")
  const [trimEnd, setTrimEnd] = useState("")

  return (
    <Card className="bg-gray-900/50 border-gray-700 p-4">
      <h3 className="text-white font-semibold mb-4 flex items-center">
        <Zap className="h-4 w-4 mr-2" />
        Herramientas de Edición
      </h3>

      <Tabs defaultValue="subtitles" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="subtitles" className="text-xs">
            <Type className="h-3 w-3 mr-1" />
            Subtítulos
          </TabsTrigger>
          <TabsTrigger value="trim" className="text-xs">
            <Scissors className="h-3 w-3 mr-1" />
            Recortar
          </TabsTrigger>
          <TabsTrigger value="audio" className="text-xs">
            <Volume2 className="h-3 w-3 mr-1" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="analyze" className="text-xs">
            <Search className="h-3 w-3 mr-1" />
            Analizar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subtitles" className="space-y-3 mt-4">
          <div>
            <Label className="text-gray-300 text-sm">Texto del subtítulo</Label>
            <Textarea
              value={subtitleText}
              onChange={(e) => setSubtitleText(e.target.value)}
              placeholder="Ingresa el texto del subtítulo..."
              className="bg-gray-800 border-gray-600 text-white text-sm mt-1"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-gray-300 text-xs">Inicio (s)</Label>
              <Input
                type="number"
                value={subtitleStart}
                onChange={(e) => setSubtitleStart(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white text-sm"
              />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Fin (s)</Label>
              <Input
                type="number"
                value={subtitleEnd}
                onChange={(e) => setSubtitleEnd(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white text-sm"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
            onClick={() =>
              onToolUse("addSubtitles", {
                text: subtitleText,
                startTime: Number.parseFloat(subtitleStart),
                endTime: Number.parseFloat(subtitleEnd),
                position: "bottom",
              })
            }
            disabled={!subtitleText || !subtitleStart || !subtitleEnd}
          >
            Agregar Subtítulo
          </Button>
        </TabsContent>

        <TabsContent value="trim" className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-gray-300 text-xs">Inicio (s)</Label>
              <Input
                type="number"
                value={trimStart}
                onChange={(e) => setTrimStart(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white text-sm"
              />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Fin (s)</Label>
              <Input
                type="number"
                value={trimEnd}
                onChange={(e) => setTrimEnd(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white text-sm"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="w-full bg-red-600 hover:bg-red-700 text-xs"
            onClick={() =>
              onToolUse("trimVideo", {
                startTime: Number.parseFloat(trimStart),
                endTime: Number.parseFloat(trimEnd),
              })
            }
            disabled={!trimStart || !trimEnd}
          >
            Recortar Video
          </Button>
        </TabsContent>

        <TabsContent value="audio" className="space-y-3 mt-4">
          <div>
            <Label className="text-gray-300 text-sm">Ajuste de Audio</Label>
            <Select>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white text-sm">
                <SelectValue placeholder="Seleccionar ajuste" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volume">Ajustar Volumen</SelectItem>
                <SelectItem value="background_music">Música de Fondo</SelectItem>
                <SelectItem value="noise_reduction">Reducir Ruido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-xs">
            Aplicar Ajuste
          </Button>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onToolUse("analyzeVideo", { analysisType: "scenes" })}
            >
              Analizar Escenas
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onToolUse("analyzeVideo", { analysisType: "objects" })}
            >
              Detectar Objetos
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onToolUse("analyzeVideo", { analysisType: "speech" })}
            >
              Transcribir Audio
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onToolUse("analyzeVideo", { analysisType: "emotions" })}
            >
              Analizar Emociones
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
