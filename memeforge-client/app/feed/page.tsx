"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/Button"
import { Card, CardContent } from "@/app/components/ui/Card"
import { 
  Heart, 
  Share2, 
  MessageCircle,
  Sparkles,
  TrendingUp,
  Filter
} from "lucide-react"

interface Meme {
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

export default function FeedPage() {
  const [memes, setMemes] = useState<Meme[]>([
    {
      id: "1",
      imageUrl: "https://picsum.photos/600/400?random=1",
      prompt: "funny cat wearing sunglasses",
      storageHash: "0x1a2b3c4d5e6f7g8h9i0j",
      likes: 1420,
      comments: 89,
      shares: 256,
      creator: "0xabc123...def456",
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      imageUrl: "https://picsum.photos/600/400?random=2",
      prompt: "doge but as a superhero",
      storageHash: "0x2b3c4d5e6f7g8h9i0j1a",
      likes: 892,
      comments: 45,
      shares: 123,
      creator: "0xdef456...ghi789",
      timestamp: "4 hours ago"
    },
    {
      id: "3",
      imageUrl: "https://picsum.photos/600/400?random=3",
      prompt: "elon musk dancing with robots",
      storageHash: "0x3c4d5e6f7g8h9i0j1a2b",
      likes: 2105,
      comments: 156,
      shares: 342,
      creator: "0xghi789...jkl012",
      timestamp: "1 hour ago"
    }
  ])

  const handleLike = (memeId: string) => {
    setMemes(memes.map(meme => 
      meme.id === memeId 
        ? { ...meme, likes: meme.likes + 1 }
        : meme
    ))
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">Trending</span> Memes
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover the most popular memes created by the community
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <Button variant="glass" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Hot</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>New</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
        </div>

        {/* Meme Grid */}
        <div className="space-y-6">
          {memes.map((meme) => (
            <Card key={meme.id} className="glassmorphism-card hover:border-cyan-500/30 transition-all duration-300">
              <CardContent className="p-6">
                {/* Meme Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-white">
                        {meme.creator}
                      </div>
                      <div className="text-sm text-gray-400">
                        {meme.timestamp}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-cyan-400 bg-black/20 px-2 py-1 rounded">
                    {meme.storageHash.slice(0, 8)}...{meme.storageHash.slice(-6)}
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
                      onClick={() => handleLike(meme.id)}
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
                      className="flex items-center space-x-2"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>{meme.shares}</span>
                    </Button>
                  </div>
                  
                  <Button variant="premium" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Remix
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}