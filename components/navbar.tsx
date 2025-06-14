import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Video, Settings } from "lucide-react"

export function Navbar() {
  return (
    <nav className="bg-black/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Video className="h-8 w-8 text-blue-500" />
          <h1 className="text-xl font-bold text-white">AI Video Editor</h1>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback className="bg-blue-600 text-white">UN</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  )
}
