"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/Button"
import { Card, CardContent } from "@/app/components/ui/Card"
import { 
  Heart, 
  Share2, 
  MessageCircle,
  Sparkles,
  TrendingUp,
  Filter,
  RefreshCw,
  ExternalLink,
  Zap,
  Clock,
  Crown,
  Users,
  ArrowUp
} from "lucide-react"
import { useAccount } from "wagmi"
import { formatHash } from "@/lib/utils"

interface Meme {
  id: string
  imageUrl: string
  prompt: string
  caption: string
  storageHash: string
  transactionHash?: string
  likes: number
  comments: number
  shares: number
  creator: string
  timestamp: string
  aiGenerated: boolean
  verified: boolean
  trendingScore: number
}

export default function FeedPage() {
  const [memes, setMemes] = useState<Meme[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'trending' | 'recent' | 'ai'>('trending')
  const [refreshing, setRefreshing] = useState(false)
  const { address, isConnected } = useAccount()

  // Mock data - 
  const mockMemes: Meme[] = [
    {
      id: "1",
      imageUrl: "https://picsum.photos/600/400?random=1",
      prompt: "funny cat wearing sunglasses",
      caption: "When you're a cat but also cool 😎",
      storageHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
      transactionHash: "0x9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a",
      likes: 1420,
      comments: 89,
      shares: 256,
      creator: "0xabc123def456ghi789jkl012mno345pqr678",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      aiGenerated: true,
      verified: true,
      trendingScore: 95
    },
    {
      id: "2",
      imageUrl: "https://picsum.photos/600/400?random=2",
      prompt: "doge but as a superhero",
      caption: "Much hero. Very save. Wow. 🦸‍♂️",
      storageHash: "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a",
      transactionHash: "0x8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a9s",
      likes: 892,
      comments: 45,
      shares: 123,
      creator: "0xdef456ghi789jkl012mno345pqr678stu901",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      aiGenerated: true,
      verified: true,
      trendingScore: 87
    },
    {
      id: "3",
      imageUrl: "https://picsum.photos/600/400?random=3",
      prompt: "elon musk dancing with robots",
      caption: "When AI throws better dance moves than you 🤖💃",
      storageHash: "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b",
      transactionHash: "0x7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a8r9s",
      likes: 2105,
      comments: 156,
      shares: 342,
      creator: "0xghi789jkl012mno345pqr678stu901vwx234",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      aiGenerated: true,
      verified: true,
      trendingScore: 98
    },
    {
      id: "4",
      imageUrl: "https://picsum.photos/600/400?random=4",
      prompt: "programmer debugging code",
      caption: "Me staring at the same bug for 3 hours 👨‍💻🔍",
      storageHash: "0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c",
      transactionHash: "0x6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a7q8r9s",
      likes: 1567,
      comments: 234,
      shares: 189,
      creator: "0xjkl012mno345pqr678stu901vwx234yzab",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      aiGenerated: true,
      verified: true,
      trendingScore: 92
    },
    {
      id: "5",
      imageUrl: "https://picsum.photos/600/400?random=5",
      prompt: "crypto market volatility",
      caption: "My portfolio doing the limbo 📉🎢",
      storageHash: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c4d",
      transactionHash: "0x5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a6p7q8r9s",
      likes: 987,
      comments: 167,
      shares: 298,
      creator: "0xmno345pqr678stu901vwx234yzabcde567",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      aiGenerated: true,
      verified: true,
      trendingScore: 85
    }
  ]

  const fetchMemes = async () => {
    setIsLoading(true)
    try {
      
      // const response = await fetch(`/api/memes?filter=${filter}&limit=20`)
      // const data = await response.json()
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Filter memes based on current filter
      let filteredMemes = [...mockMemes]
      
      switch (filter) {
        case 'recent':
          filteredMemes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          break
        case 'ai':
          filteredMemes = filteredMemes.filter(meme => meme.aiGenerated)
          break
        case 'trending':
        default:
          filteredMemes.sort((a, b) => b.trendingScore - a.trendingScore)
          break
      }
      
      setMemes(filteredMemes)
    } catch (error) {
      console.error('Failed to fetch memes:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const refreshFeed = () => {
    setRefreshing(true)
    fetchMemes()
  }

  const handleLike = async (memeId: string) => {
    if (!isConnected) {
      alert("Please connect your wallet to like memes")
      return
    }

    setMemes(memes.map(meme => 
      meme.id === memeId 
        ? { ...meme, likes: meme.likes + 1, trendingScore: meme.trendingScore + 5 }
        : meme
    ))

    // await fetch(`/api/memes/${memeId}/like`, { method: 'POST' })
  }

  const handleShare = async (meme: Meme) => {
    const shareUrl = `${window.location.origin}/meme/${meme.storageHash}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this AI-generated meme!',
          text: meme.caption,
          url: shareUrl,
        })
        
        // Update share count
        setMemes(memes.map(m => 
          m.id === meme.id 
            ? { ...m, shares: m.shares + 1, trendingScore: m.trendingScore + 2 }
            : m
        ))
        
        // await fetch(`/api/memes/${meme.id}/share`, { method: 'POST' })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl)
      alert('Meme link copied to clipboard!')
      
      // Update share count
      setMemes(memes.map(m => 
        m.id === meme.id 
          ? { ...m, shares: m.shares + 1, trendingScore: m.trendingScore + 2 }
          : m
      ))
    }
  }

  const verifyStorage = async (storageHash: string) => {
    try {
      const response = await fetch('/api/storage/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rootHash: storageHash })
      })

      const data = await response.json()
      
      if (data.success && data.exists) {
        alert('✅ Storage verified! File exists on OG Storage.')
      } else {
        alert('❌ Storage verification failed. File may not exist.')
      }
    } catch (error) {
      alert('❌ Verification request failed.')
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diff = now.getTime() - past.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getTrendingBadge = (score: number) => {
    if (score >= 95) return { color: 'text-yellow-400', icon: Crown, label: 'Viral' }
    if (score >= 85) return { color: 'text-orange-400', icon: TrendingUp, label: 'Trending' }
    if (score >= 75) return { color: 'text-purple-400', icon: ArrowUp, label: 'Rising' }
    return null
  }

  useEffect(() => {
    fetchMemes()
  }, [filter])

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">Trending</span> Memes
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover the most popular AI-generated memes from the community
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glassmorphism-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold gradient-text">{memes.length}</div>
              <div className="text-gray-400 text-sm">Total Memes</div>
            </CardContent>
          </Card>
          <Card className="glassmorphism-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold gradient-text">
                {memes.reduce((sum, meme) => sum + meme.likes, 0).toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Total Likes</div>
            </CardContent>
          </Card>
          <Card className="glassmorphism-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold gradient-text">
                {memes.filter(m => m.aiGenerated).length}
              </div>
              <div className="text-gray-400 text-sm">AI Generated</div>
            </CardContent>
          </Card>
          <Card className="glassmorphism-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold gradient-text">
                {memes.reduce((sum, meme) => sum + meme.shares, 0).toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Total Shares</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap gap-4 mb-8 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === 'trending' ? 'premium' : 'outline'} 
              onClick={() => setFilter('trending')}
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Trending</span>
            </Button>
            <Button 
              variant={filter === 'recent' ? 'premium' : 'outline'} 
              onClick={() => setFilter('recent')}
              className="flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Recent</span>
            </Button>
            <Button 
              variant={filter === 'ai' ? 'premium' : 'outline'} 
              onClick={() => setFilter('ai')}
              className="flex items-center space-x-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Only</span>
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={refreshFeed}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Meme Grid */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((skeleton) => (
              <Card key={skeleton} className="glassmorphism-card animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-24"></div>
                      <div className="h-3 bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-64 bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : memes.length > 0 ? (
          <div className="space-y-6">
            {memes.map((meme) => {
              const trendingBadge = getTrendingBadge(meme.trendingScore)
              const TrendingIcon = trendingBadge?.icon
              
              return (
                <Card key={meme.id} className="glassmorphism-card hover:border-cyan-500/30 transition-all duration-300 group">
                  <CardContent className="p-6">
                    {/* Meme Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center space-x-2">
                            <span>{formatHash(meme.creator)}</span>
                            {meme.verified && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <Zap className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>{getTimeAgo(meme.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {trendingBadge && (
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-black/20 ${trendingBadge.color}`}>
                            {/* <TrendingIcon className="h-3 w-3" /> */}
                            <span className="text-xs font-medium">{trendingBadge.label}</span>
                          </div>
                        )}
                        <div className="text-xs font-mono text-cyan-400 bg-black/20 px-2 py-1 rounded">
                          {formatHash(meme.storageHash)}
                        </div>
                      </div>
                    </div>

                    {/* Meme Image */}
                    <div className="rounded-lg overflow-hidden mb-4 bg-black/20 border border-white/10 group-hover:border-cyan-500/50 transition-all duration-300">
                      <img 
                        src={meme.imageUrl} 
                        alt={meme.caption}
                        className="w-full h-auto"
                      />
                    </div>

                    {/* Caption and Prompt */}
                    <div className="mb-4 space-y-3">
                      <div className="p-3 bg-black/20 rounded-lg border border-white/10">
                        <div className="text-sm text-gray-400 mb-1">AI Caption</div>
                        <div className="text-white font-medium">"{meme.caption}"</div>
                      </div>
                      
                      {meme.prompt && (
                        <div className="p-3 bg-black/20 rounded-lg border border-white/10">
                          <div className="text-sm text-gray-400 mb-1 flex items-center space-x-2">
                            <Sparkles className="h-3 w-3" />
                            <span>AI Prompt</span>
                          </div>
                          <div className="text-white text-sm">"{meme.prompt}"</div>
                        </div>
                      )}
                    </div>

                    {/* Storage Verification */}
                    <div className="p-3 bg-black/20 rounded-lg border border-white/10 mb-4">
                      <div className="text-sm text-gray-400 mb-2">OG Storage Verification</div>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-xs text-cyan-400 flex-1 truncate mr-2">
                          {meme.storageHash}
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => verifyStorage(meme.storageHash)}
                            className="h-7 px-2"
                          >
                            Verify
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`https://og-scan.com/tx/${meme.transactionHash}`, '_blank')}
                            className="h-7 px-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleLike(meme.id)}
                          disabled={!isConnected}
                          className="flex items-center space-x-2"
                        >
                          <Heart className="h-4 w-4" />
                          <span>{meme.likes.toLocaleString()}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{meme.comments.toLocaleString()}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleShare(meme)}
                          className="flex items-center space-x-2"
                        >
                          <Share2 className="h-4 w-4" />
                          <span>{meme.shares.toLocaleString()}</span>
                        </Button>
                      </div>
                      
                      <Button 
                        variant="premium" 
                        size="sm"
                        onClick={() => {
                          // Navigate to remix page with meme data
                          window.location.href = `/generate?remix=${meme.id}`
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Remix
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="glassmorphism-card">
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-6 text-cyan-400" />
              <h3 className="text-xl font-semibold mb-2">No Memes Found</h3>
              <p className="text-gray-300 mb-6">
                {filter === 'ai' 
                  ? "No AI-generated memes found. Be the first to create one!"
                  : "No memes found for the selected filter."
                }
              </p>
              <Button variant="premium" asChild>
                <a href="/generate">
                  Create Your First Meme
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Load More Button */}
        {memes.length > 0 && !isLoading && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={() => {
                // In production, this would load more memes
                console.log('Load more memes...')
              }}
            >
              Load More Memes
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}