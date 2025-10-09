"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card"
import { 
  User, 
  Sparkles, 
  Copy,
  ExternalLink,
  Wallet
} from "lucide-react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { formatHash } from "@/lib/utils"

interface UserMeme {
  id: string
  imageUrl: string
  prompt: string
  storageHash: string
  likes: number
  comments: number
  shares: number
  timestamp: string
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const [userMemes, setUserMemes] = useState<UserMeme[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (address) {
      fetchUserMemes()
    }
  }, [address])

  const fetchUserMemes = async () => {
    if (!address) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/memes?creator=${address}`)
      const data = await response.json()
      
      if (data.success) {
        setUserMemes(data.memes)
      }
    } catch (error) {
      console.error('Failed to fetch user memes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      alert('Address copied to clipboard!')
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glassmorphism-card border-cyan-500/30">
            <CardContent className="p-12">
              <User className="h-16 w-16 mx-auto mb-6 text-cyan-400" />
              <h1 className="text-3xl font-bold mb-4">Profile</h1>
              <p className="text-gray-300 mb-8">
                Connect your wallet to view your meme creation history and profile
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <Card className="glassmorphism-card mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Wallet className="h-4 w-4" />
                      <span className="font-mono">{formatHash(address!)}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={copyAddress}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold gradient-text mb-1">
                  {userMemes.length}
                </div>
                <div className="text-gray-400">Memes Created</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User's Memes */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Memes</h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your memes...</p>
            </div>
          ) : userMemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userMemes.map((meme) => (
                <Card key={meme.id} className="glassmorphism-card hover:border-cyan-500/30 transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="aspect-square rounded-lg overflow-hidden bg-black/20 mb-3">
                      <img 
                        src={meme.imageUrl} 
                        alt={meme.prompt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-white line-clamp-2">"{meme.prompt}"</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{meme.likes} likes</span>
                        <span>{new Date(meme.timestamp).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="font-mono text-xs text-cyan-400 flex-1 truncate">
                          {formatHash(meme.storageHash)}
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glassmorphism-card">
              <CardContent className="p-12 text-center">
                <Sparkles className="h-16 w-16 mx-auto mb-6 text-cyan-400" />
                <h3 className="text-xl font-semibold mb-2">No Memes Yet</h3>
                <p className="text-gray-300 mb-6">
                  You haven't created any memes yet. Start creating to build your collection!
                </p>
                <Button variant="premium" asChild>
                  <a href="/generate">
                    Create Your First Meme
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}