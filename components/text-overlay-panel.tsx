"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Type, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Plus,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import { TextOverlay, TextOverlayPreset, DEFAULT_TEXT_PRESETS } from '@/types/text-overlay'

interface TextOverlayPanelProps {
  textOverlays: TextOverlay[]
  currentTime: number
  onAddTextOverlay: (textOverlay: Omit<TextOverlay, 'id'>) => void
  onUpdateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void
  onDeleteTextOverlay: (id: string) => void
  selectedTextId?: string
  onSelectText: (id: string | undefined) => void
}

export function TextOverlayPanel({
  textOverlays,
  currentTime,
  onAddTextOverlay,
  onUpdateTextOverlay,
  onDeleteTextOverlay,
  selectedTextId,
  onSelectText
}: TextOverlayPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTextContent, setNewTextContent] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>('title-large')

  const selectedText = textOverlays.find(t => t.id === selectedTextId)

  const handleAddText = () => {
    if (!newTextContent.trim()) return

    const preset = DEFAULT_TEXT_PRESETS.find(p => p.id === selectedPreset)
    const newTextOverlay: Omit<TextOverlay, 'id'> = {
      content: newTextContent,
      startTime: currentTime,
      duration: 3, // 3 segundos por defecto
      position: { x: 50, y: 50 }, // Centro de la pantalla
      style: preset?.style || DEFAULT_TEXT_PRESETS[0].style,
      animation: preset?.animation,
      layer: textOverlays.length + 1
    }

    onAddTextOverlay(newTextOverlay)
    setNewTextContent('')
    setShowAddForm(false)
  }

  const handleStyleUpdate = (property: string, value: any) => {
    if (!selectedText) return
    
    onUpdateTextOverlay(selectedText.id, {
      style: {
        ...selectedText.style,
        [property]: value
      }
    })
  }

  const handlePositionUpdate = (axis: 'x' | 'y', value: number) => {
    if (!selectedText) return
    
    onUpdateTextOverlay(selectedText.id, {
      position: {
        ...selectedText.position,
        [axis]: value
      }
    })
  }

  const visibleTexts = textOverlays.filter(text => 
    currentTime >= text.startTime && currentTime <= text.startTime + text.duration
  )

  return (
    <Card className="h-full bg-gray-900 border-gray-700 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Type className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Texto y Títulos</h3>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar Texto
          </Button>
        </div>

        {/* Textos visibles en el tiempo actual */}
        {visibleTexts.length > 0 && (
          <div className="mb-4">
            <Label className="text-sm text-gray-400 mb-2 block">Textos Visibles</Label>
            <div className="flex flex-wrap gap-2">
              {visibleTexts.map(text => (
                <Badge 
                  key={text.id}
                  variant={selectedTextId === text.id ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => onSelectText(text.id)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {text.content.substring(0, 20)}...
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Formulario para agregar texto */}
        {showAddForm && (
          <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
            <div>
              <Label className="text-sm text-gray-300">Contenido del Texto</Label>
              <Textarea
                value={newTextContent}
                onChange={(e) => setNewTextContent(e.target.value)}
                placeholder="Escribe tu texto aquí..."
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm text-gray-300">Estilo Predefinido</Label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_TEXT_PRESETS.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleAddText} size="sm" className="bg-green-600 hover:bg-green-700">
                Agregar
              </Button>
              <Button 
                onClick={() => setShowAddForm(false)} 
                variant="ghost" 
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Panel de edición del texto seleccionado */}
      <div className="flex-1 overflow-auto p-4">
        {selectedText ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium">Editando Texto</h4>
              <Button
                onClick={() => onDeleteTextOverlay(selectedText.id)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Contenido */}
            <div>
              <Label className="text-sm text-gray-300">Contenido</Label>
              <Textarea
                value={selectedText.content}
                onChange={(e) => onUpdateTextOverlay(selectedText.id, { content: e.target.value })}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                rows={3}
              />
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-300">Inicio (s)</Label>
                <Input
                  type="number"
                  value={selectedText.startTime}
                  onChange={(e) => onUpdateTextOverlay(selectedText.id, { startTime: parseFloat(e.target.value) || 0 })}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  step="0.1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-300">Duración (s)</Label>
                <Input
                  type="number"
                  value={selectedText.duration}
                  onChange={(e) => onUpdateTextOverlay(selectedText.id, { duration: parseFloat(e.target.value) || 1 })}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  step="0.1"
                  min="0.1"
                />
              </div>
            </div>

            {/* Posición */}
            <div>
              <Label className="text-sm text-gray-300 mb-3 block">Posición</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-400">Horizontal (%)</Label>
                  <Slider
                    value={[selectedText.position.x]}
                    onValueChange={([value]) => handlePositionUpdate('x', value)}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <span className="text-xs text-gray-400">{selectedText.position.x}%</span>
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Vertical (%)</Label>
                  <Slider
                    value={[selectedText.position.y]}
                    onValueChange={([value]) => handlePositionUpdate('y', value)}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <span className="text-xs text-gray-400">{selectedText.position.y}%</span>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Estilo de Texto */}
            <div>
              <Label className="text-sm text-gray-300 mb-3 block">Estilo de Texto</Label>
              
              {/* Tamaño de fuente */}
              <div className="mb-4">
                <Label className="text-xs text-gray-400">Tamaño de Fuente</Label>
                <Slider
                  value={[selectedText.style.fontSize]}
                  onValueChange={([value]) => handleStyleUpdate('fontSize', value)}
                  min={12}
                  max={120}
                  step={2}
                  className="mt-2"
                />
                <span className="text-xs text-gray-400">{selectedText.style.fontSize}px</span>
              </div>

              {/* Familia de fuente */}
              <div className="mb-4">
                <Label className="text-xs text-gray-400">Fuente</Label>
                <Select 
                  value={selectedText.style.fontFamily} 
                  onValueChange={(value) => handleStyleUpdate('fontFamily', value)}
                >
                  <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Arial Black">Arial Black</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botones de formato */}
              <div className="flex space-x-2 mb-4">
                <Button
                  variant={selectedText.style.bold ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleStyleUpdate('bold', !selectedText.style.bold)}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedText.style.italic ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleStyleUpdate('italic', !selectedText.style.italic)}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedText.style.underline ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleStyleUpdate('underline', !selectedText.style.underline)}
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </div>

              {/* Alineación */}
              <div className="flex space-x-2 mb-4">
                <Button
                  variant={selectedText.style.textAlign === 'left' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleStyleUpdate('textAlign', 'left')}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedText.style.textAlign === 'center' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleStyleUpdate('textAlign', 'center')}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedText.style.textAlign === 'right' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleStyleUpdate('textAlign', 'right')}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Color del texto */}
              <div className="mb-4">
                <Label className="text-xs text-gray-400">Color del Texto</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="color"
                    value={selectedText.style.color}
                    onChange={(e) => handleStyleUpdate('color', e.target.value)}
                    className="w-8 h-8 rounded border border-gray-600"
                  />
                  <Input
                    value={selectedText.style.color}
                    onChange={(e) => handleStyleUpdate('color', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white text-xs"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Opacidad */}
              <div className="mb-4">
                <Label className="text-xs text-gray-400">Opacidad</Label>
                <Slider
                  value={[selectedText.style.opacity * 100]}
                  onValueChange={([value]) => handleStyleUpdate('opacity', value / 100)}
                  max={100}
                  step={5}
                  className="mt-2"
                />
                <span className="text-xs text-gray-400">{Math.round(selectedText.style.opacity * 100)}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-8">
            <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecciona un texto para editarlo</p>
            <p className="text-sm mt-2">o agrega uno nuevo usando el botón de arriba</p>
          </div>
        )}
      </div>

      {/* Lista de todos los textos */}
      <div className="border-t border-gray-700 p-4 flex-shrink-0">
        <Label className="text-sm text-gray-300 mb-2 block">Todos los Textos ({textOverlays.length})</Label>
        <div className="space-y-2 max-h-32 overflow-auto">
          {textOverlays.map(text => (
            <div
              key={text.id}
              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                selectedTextId === text.id 
                  ? 'bg-blue-600/20 border border-blue-600/50' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              onClick={() => onSelectText(text.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{text.content}</p>
                <p className="text-xs text-gray-400">
                  {text.startTime.toFixed(1)}s - {(text.startTime + text.duration).toFixed(1)}s
                </p>
              </div>
              <div className="flex items-center space-x-1">
                {currentTime >= text.startTime && currentTime <= text.startTime + text.duration ? (
                  <Eye className="h-4 w-4 text-green-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
