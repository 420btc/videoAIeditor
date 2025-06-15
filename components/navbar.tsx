import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, Video, Bot, Sparkles, Scissors, Volume2, Search, Type, Zap, Palette, Wand2, Image, Clock, Layers } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NavbarProps {
  // showTextOverlays: boolean; // Removed
  // onToggleTextOverlays: () => void; // Removed
}

export function Navbar({ }: NavbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const aiFeatures = [
     {
       category: "Edición Básica",
       features: [
         { name: "Recortar Video", aiFunction: "trim_video", icon: Scissors, description: "Corta y ajusta la duración del video", status: "Disponible" },
         { name: "Ajustar Audio", aiFunction: "adjust_audio", icon: Volume2, description: "Controla volumen, silenciar y efectos de audio", status: "Disponible" },
         { name: "Análisis de Video", aiFunction: "analyze_video", icon: Search, description: "Analiza contenido y detecta escenas automáticamente", status: "Disponible" }
       ]
     },
     {
       category: "Texto y Subtítulos",
       features: [
         { name: "Subtítulos Automáticos", aiFunction: "add_subtitles", icon: Type, description: "Genera subtítulos usando IA de reconocimiento de voz", status: "Disponible" },
         { name: "Texto Overlay", aiFunction: "add_text_overlay", icon: Type, description: "Añade texto personalizado con estilos predefinidos", status: "Disponible" },
         { name: "Traducción de Subtítulos", aiFunction: "translate_subtitles", icon: Bot, description: "Traduce subtítulos a múltiples idiomas", status: "Próximamente" }
       ]
     },
     {
       category: "Efectos Visuales",
       features: [
         { name: "Transiciones IA", aiFunction: "add_transition", icon: Zap, description: "Aplica transiciones inteligentes entre clips", status: "Disponible" },
         { name: "Filtros Automáticos", aiFunction: "apply_filters", icon: Palette, description: "Mejora colores y calidad usando IA", status: "Próximamente" },
         { name: "Estabilización", aiFunction: "stabilize_video", icon: Wand2, description: "Estabiliza videos temblorosos automáticamente", status: "Próximamente" }
       ]
     },
     {
       category: "Generación de Contenido",
       features: [
         { name: "Miniaturas IA", aiFunction: "generate_thumbnail", icon: Image, description: "Genera thumbnails atractivos automáticamente", status: "Disponible" },
         { name: "Resumen de Video", aiFunction: "create_summary", icon: Clock, description: "Crea resúmenes automáticos de videos largos", status: "Próximamente" },
         { name: "Música de Fondo", aiFunction: "add_background_music", icon: Volume2, description: "Sugiere y añade música apropiada", status: "Próximamente" }
       ]
     },
     {
       category: "Edición Avanzada",
       features: [
         { name: "Composición Multi-pista", aiFunction: "compose_multitrack", icon: Layers, description: "Combina múltiples clips en timeline", status: "Disponible" },
         { name: "Detección de Objetos", aiFunction: "detect_objects", icon: Search, description: "Identifica y rastrea objetos en el video", status: "Próximamente" },
         { name: "Edición por Comandos", aiFunction: "natural_language_edit", icon: Bot, description: "Edita usando comandos de texto natural", status: "Disponible" }
       ]
     }
   ]

  return (
    <nav className="bg-black/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Video className="h-8 w-8 text-blue-500" />
          <h1 className="text-xl font-bold text-white">AI Video Editor</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center text-xl">
                  <Sparkles className="h-6 w-6 mr-2 text-blue-500" />
                  Funciones de IA - Editor de Video
                </DialogTitle>
                <DialogDescription className="text-gray-300">
                  Descubre todas las herramientas de inteligencia artificial disponibles para editar tus videos
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="features" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                  <TabsTrigger value="features" className="text-white">Funciones Disponibles</TabsTrigger>
                  <TabsTrigger value="settings" className="text-white">Configuración</TabsTrigger>
                </TabsList>
                
                <TabsContent value="features" className="mt-4">
                  <div className="grid gap-6 max-h-[60vh] overflow-y-auto pr-2">
                    {aiFeatures.map((category, categoryIndex) => (
                      <Card key={categoryIndex} className="bg-gray-800/50 border-gray-600">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg text-white flex items-center">
                            <Bot className="h-5 w-5 mr-2 text-blue-400" />
                            {category.category}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3">
                            {category.features.map((feature, featureIndex) => {
                               const IconComponent = feature.icon
                               return (
                                 <div key={featureIndex} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                                   <IconComponent className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                   <div className="flex-1 min-w-0">
                                     <div className="flex items-center justify-between mb-1">
                                       <div className="flex flex-col">
                                         <h4 className="text-sm font-medium text-white">{feature.name}</h4>
                                         <code className="text-xs text-blue-300 font-mono bg-gray-800/50 px-1 py-0.5 rounded mt-1">
                                           {feature.aiFunction}
                                         </code>
                                       </div>
                                       <Badge 
                                         variant={feature.status === "Disponible" ? "default" : "secondary"}
                                         className={`text-xs ${
                                           feature.status === "Disponible" 
                                             ? "bg-green-600 hover:bg-green-700" 
                                             : "bg-yellow-600 hover:bg-yellow-700"
                                         }`}
                                       >
                                         {feature.status}
                                       </Badge>
                                     </div>
                                     <p className="text-xs text-gray-300">{feature.description}</p>
                                   </div>
                                 </div>
                               )
                             })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="mt-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white">Configuración del Editor</CardTitle>
                      <CardDescription className="text-gray-300">
                        Ajusta las preferencias del editor de video
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                          <div>
                            <h4 className="text-sm font-medium text-white">Calidad de Exportación</h4>
                            <p className="text-xs text-gray-300">Calidad por defecto para videos exportados</p>
                          </div>
                          <Badge className="bg-blue-600">1080p</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                          <div>
                            <h4 className="text-sm font-medium text-white">Formato de Exportación</h4>
                            <p className="text-xs text-gray-300">Formato de archivo por defecto</p>
                          </div>
                          <Badge className="bg-blue-600">MP4</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                          <div>
                            <h4 className="text-sm font-medium text-white">Idioma de Subtítulos</h4>
                            <p className="text-xs text-gray-300">Idioma por defecto para generación automática</p>
                          </div>
                          <Badge className="bg-blue-600">Español</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                          <div>
                            <h4 className="text-sm font-medium text-white">Asistente IA</h4>
                            <p className="text-xs text-gray-300">Estado del asistente de inteligencia artificial</p>
                          </div>
                          <Badge className="bg-green-600">Activo</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback className="bg-blue-600 text-white">UN</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  )
}
