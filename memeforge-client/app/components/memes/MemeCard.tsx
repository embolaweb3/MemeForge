import { Card, CardContent } from "@/app/components/ui/Card"
import { Button } from "@/app/components/ui/Button"
import { Heart, Share2, MessageCircle, Sparkles } from "lucide-react"
import { formatHash } from "@/lib/utils"

interface MemeCardProps {
  meme: {
    id: string
    imageUrl: string
    prompt: string
    storageHash: string
    likes: number
    comments: number
    shares: number
    creator: string
    timestamp: string
  }
  onLike: (id: string) => void
  onShare: (id: string) => void
  onRemix: (id: string) => void
}

export function MemeCard({ meme, onLike, onShare, onRemix }: MemeCardProps) {
  return (
    <Card className="glassmorphism-card hover:border-cyan-500/30 transition-all duration-300">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
            <div>
              <div className="font-medium text-white">
                {formatHash(meme.creator)}
              </div>
              <div className="text-sm text-gray-400">
                {meme.timestamp}
              </div>
            </div>
          </div>
          <div className="text-xs font-mono text-cyan-400 bg-black/20 px-2 py-1 rounded">
            {formatHash(meme.storageHash)}
          </div>
        </div>

        {/* Meme Image */}
        <div className="rounded-lg overflow-hidden mb-4 bg-black/20 border border-white/10">
          <img 
            src={meme.imageUrl} 
            alt={meme.prompt}
            className="w-full h-auto"
          />
        </div>

        {/* Prompt */}
        <div className="mb-4 p-3 bg-black/20 rounded-lg border border-white/10">
          <div className="text-sm text-gray-400 mb-1">AI Prompt</div>
          <div className="text-white">"{meme.prompt}"</div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onLike(meme.id)}
              className="flex items-center space-x-2"
            >
              <Heart className="h-4 w-4" />
              <span>{meme.likes}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{meme.comments}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onShare(meme.id)}
              className="flex items-center space-x-2"
            >
              <Share2 className="h-4 w-4" />
              <span>{meme.shares}</span>
            </Button>
          </div>
          
          <Button 
            variant="premium" 
            size="sm"
            onClick={() => onRemix(meme.id)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Remix
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}