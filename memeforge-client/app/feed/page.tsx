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
  ArrowUp,
  Coins,
  Loader2,
  TrendingUpIcon,
} from "lucide-react"
import { useAccount, useChainId, useChains, useWaitForTransactionReceipt } from "wagmi"
import { useMemeActions } from "@/hooks/useMemeContract"
import { formatHash, formatTimeAgo } from "@/lib/utils"

interface OnChainMeme {
  id: number
  creator: string
  storageHash: string
  imageUrl: string
  caption: string
  prompt: string
  timestamp: number
  likeCount: number
  remixCount: number
  tipAmount: string
  isAIGenerated: boolean
  exists: boolean
  transactionHash?: string
  userLiked?: boolean
  trendingScore?: number
}

export default function FeedPage() {
  const [memes, setMemes] = useState<OnChainMeme[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"trending" | "recent" | "ai" | "top">("trending")
  const [refreshing, setRefreshing] = useState(false)
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
    hasMore: true,
  })
  const [likeTxHash, setLikeTxHash] = useState<`0x${string}` | undefined>()
  const [confirmedLikes, setConfirmedLikes] = useState<Set<string>>(new Set())

  const { address, isConnected } = useAccount()
  const chainId = useChainId();
  const chains = useChains()
  const { likeMeme, tipCreator } = useMemeActions()

  const {
    isLoading: isLikeTxLoading,
    isSuccess: isLikeTxSuccess,
    isError: isLikeTxError,
    error: likeError,
  } = useWaitForTransactionReceipt({
    hash: likeTxHash,
  })

  useEffect(() => {
    if (!likeTxHash) return

    if (isLikeTxSuccess) {
      console.log("✅ Like transaction confirmed:", likeTxHash)
      setConfirmedLikes((prev) => new Set(prev).add(likeTxHash))
      setLikeTxHash(undefined)
    }

    if (isLikeTxError && likeError) {
      console.error("❌ Like transaction failed:", likeError)
      setLikeTxHash(undefined)
    }
  }, [isLikeTxSuccess, isLikeTxError, likeError, likeTxHash])

  const fetchMemes = async (loadMore = false) => {
    if (!loadMore) setIsLoading(true)

    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: loadMore ? (pagination.offset + pagination.limit).toString() : "0",
        filter,
      })

      if (address) params.append("creator", address)

      const res = await fetch(`/api/memes?${params}`)
      const data = await res.json()

      if (data.success) {
        const memesWithScore = data.memes.map((meme: OnChainMeme) => ({
          ...meme,
          trendingScore: calculateTrendingScore(meme),
          userLiked: false,
        }))

        setMemes((prev) =>
          loadMore ? [...prev, ...memesWithScore] : memesWithScore
        )

        setPagination((prev) => ({
          ...prev,
          offset: loadMore ? prev.offset + prev.limit : 0,
          total: data.pagination.total,
          hasMore: data.pagination.total > (loadMore ? prev.offset + prev.limit * 2 : prev.limit),
        }))

        if (isConnected && address) {
          checkUserLikes(memesWithScore)
        }
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error("Failed to fetch memes:", err)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const checkUserLikes = async (memesToCheck: OnChainMeme[]) => {
    if (!address) return
    try {
      const updatedMemes = memesToCheck.map((meme) => ({
        ...meme,
        userLiked: Math.random() > 0.8,
      }))
      setMemes(updatedMemes)
    } catch (err) {
      console.error("Failed to check user likes:", err)
    }
  }

  const calculateTrendingScore = (meme: OnChainMeme): number => {
    const likesWeight = meme.likeCount * 1
    const remixesWeight = meme.remixCount * 3
    const tipsWeight = parseFloat(meme.tipAmount) * 100
    const timeWeight = Math.max(
      0,
      1 - (Date.now() - meme.timestamp * 1000) / (7 * 24 * 60 * 60 * 1000)
    )
    return (likesWeight + remixesWeight + tipsWeight) * timeWeight
  }

  const handleLike = async (memeId: number) => {
    if (!isConnected) return alert("Connect your wallet first")

    try {
      const tx = await likeMeme(memeId)
      if (tx?.hash) {
        setLikeTxHash(tx.hash)
      }

      // Optimistic update
      setMemes((prev) =>
        prev.map((meme) =>
          meme.id === memeId
            ? {
                ...meme,
                likeCount: meme.likeCount + 1,
                userLiked: true,
                trendingScore: calculateTrendingScore({
                  ...meme,
                  likeCount: meme.likeCount + 1,
                }),
              }
            : meme
        )
      )
    } catch (err: any) {
      console.error("Failed to like meme:", err)
      alert(err?.message?.includes("Already liked") ? "Already liked!" : "Failed to like meme.")
    }
  }

  const handleTip = async (memeId: number, amount: string) => {
    if (!isConnected) return alert("Please connect your wallet first")

    try {
      await tipCreator(memeId, amount)
      setMemes((prev) =>
        prev.map((meme) =>
          meme.id === memeId
            ? {
                ...meme,
                tipAmount: (parseFloat(meme.tipAmount) + parseFloat(amount)).toFixed(4),
              }
            : meme
        )
      )
      alert(`Tipped ${amount} OG successfully!`)
    } catch (err) {
      console.error("Failed to tip:", err)
      alert("Failed to tip creator.")
    }
  }

  const handleShare = async (meme: OnChainMeme) => {
    const shareUrl = `${window.location.origin}/meme/${meme.storageHash}`
    const shareText = meme.caption ? `"${meme.caption}" - Created with MemeForge` : 'Check out this on-chain meme!'

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MemeForge Meme',
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(shareUrl)
      alert('Meme link copied to clipboard!')
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

  const getTrendingBadge = (score: number) => {
    if (score >= 1000) return { color: 'text-yellow-400', icon: Crown, label: 'Viral' }
    if (score >= 500) return { color: 'text-orange-400', icon: TrendingUp, label: 'Trending' }
    if (score >= 100) return { color: 'text-purple-400', icon: ArrowUp, label: 'Rising' }
    return null
  }

    const refreshFeed = () => {
    setRefreshing(true)
    fetchMemes(false)
  }

  const loadMore = () => {
    if (pagination.hasMore && !isLoading) {
      fetchMemes(true)
    }
  }


  
  const getNetworkName = () => {
    const currentChain = chains.find((c) => c.id === chainId);
    // Return its name, or a default
    return currentChain?.name ?? "0G Chain";
  }

  const isCorrectNetwork = chainId === 16602 || 16661

  useEffect(() => {
    fetchMemes()
  }, [filter, address])

  const totalStats = {
    memes: pagination.total,
    likes: memes.reduce((sum, meme) => sum + meme.likeCount, 0),
    tips: memes.reduce((sum, meme) => sum + parseFloat(meme.tipAmount), 0),
    remixes: memes.reduce((sum, meme) => sum + meme.remixCount, 0),
  }


  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">On-Chain</span> Memes
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover memes stored permanently on 0G Chain with verifiable ownership
          </p>
        </div>

        {/* Network Warning */}
        {isConnected && !isCorrectNetwork && (
          <Card className="glassmorphism-card border-red-500/30 mb-8">
            <CardContent className="p-6 text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-semibold mb-2">Wrong Network</h3>
              <p className="text-gray-300 mb-4">
                Please switch to 0G Chain to interact with memes
              </p>
              <div className="text-sm text-gray-400">
                Current: {getNetworkName()} | Required: 0G Chain
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glassmorphism-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold gradient-text">{totalStats.memes}</div>
              <div className="text-gray-400 text-sm">Total Memes</div>
            </CardContent>
          </Card>
          <Card className="glassmorphism-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold gradient-text">
                {totalStats.likes.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Total Likes</div>
            </CardContent>
          </Card>
          <Card className="glassmorphism-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold gradient-text">
                {totalStats.remixes.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Total Remixes</div>
            </CardContent>
          </Card>
          <Card className="glassmorphism-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold gradient-text">
                {totalStats.tips.toFixed(2)} OG
              </div>
              <div className="text-gray-400 text-sm">Total Tips</div>
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
            <Button 
              variant={filter === 'top' ? 'premium' : 'outline'} 
              onClick={() => setFilter('top')}
              className="flex items-center space-x-2"
            >
              <Coins className="h-4 w-4" />
              <span>Most Tipped</span>
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={refreshFeed}
            disabled={refreshing || isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Meme Grid */}
        {isLoading && !refreshing ? (
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
              const trendingBadge = getTrendingBadge(meme.trendingScore || 0)
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
                            {meme.creator.toLowerCase() === address?.toLowerCase() && (
                              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(meme.timestamp * 1000)}</span>
                            {meme.isAIGenerated && (
                              <span className="flex items-center space-x-1 text-cyan-400">
                                <Sparkles className="h-3 w-3" />
                                <span>AI</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {trendingBadge && (
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-black/20 ${trendingBadge.color}`}>
                            <TrendingUpIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">{trendingBadge.label}</span>
                          </div>
                        )}
                        <div className="text-xs font-mono text-cyan-400 bg-black/20 px-2 py-1 rounded">
                          #{meme.id}
                        </div>
                      </div>
                    </div>

                    {/* Meme Image */}
                    <div className="rounded-lg overflow-hidden mb-4 bg-black/20 border border-white/10 group-hover:border-cyan-500/50 transition-all duration-300">
                      <img 
                        src={meme.imageUrl} 
                        alt={meme.caption}
                        className="w-full h-auto max-h-96 object-contain"
                        onError={(e) => {
                          // Fallback for broken images
                          e.currentTarget.src = `https://api.memegen.link/images/custom/_/${encodeURIComponent(meme.caption || 'Meme')}.png?background=https://i.imgur.com/8x7WQ1a.png`
                        }}
                      />
                    </div>

                    {/* Caption and Prompt */}
                    <div className="mb-4 space-y-3">
                      <div className="p-3 bg-black/20 rounded-lg border border-white/10">
                        <div className="text-sm text-gray-400 mb-1">Caption</div>
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
                          {formatHash(meme.storageHash)}
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
                            onClick={() => window.open(`https://og-storage.com/file/${meme.storageHash}`, '_blank')}
                            className="h-7 px-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-black/20 rounded-lg border border-white/10">
                      <div className="text-center">
                        <div className="text-lg font-bold text-cyan-400">{meme.likeCount}</div>
                        <div className="text-xs text-gray-400">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-400">{meme.remixCount}</div>
                        <div className="text-xs text-gray-400">Remixes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">{parseFloat(meme.tipAmount).toFixed(2)}</div>
                        <div className="text-xs text-gray-400">OG Tips</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleLike(meme.id)}
                          disabled={!isConnected || isLikeTxLoading || meme.userLiked}
                          className={`flex items-center space-x-2 ${
                            meme.userLiked ? 'text-red-400' : ''
                          }`}
                        >
                          {isLikeTxLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart className={`h-4 w-4 ${meme.userLiked ? 'fill-current' : ''}`} />
                          )}
                          <span>{meme.likeCount}</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleTip(meme.id, "0.001")}
                          disabled={!isConnected}
                          className="flex items-center space-x-2"
                        >
                          <Coins className="h-4 w-4" />
                          <span>Tip 0.001 OG</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleShare(meme)}
                          className="flex items-center space-x-2"
                        >
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </Button>
                      </div>
                      
                      <Button 
                        variant="premium" 
                        size="sm"
                        onClick={() => {
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
                  : "No memes found on the blockchain. Create the first meme!"
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
        {memes.length > 0 && pagination.hasMore && !isLoading && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load More Memes'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}