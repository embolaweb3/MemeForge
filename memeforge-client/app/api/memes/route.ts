import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import MemeRegistryABI from '@/lib/abis/MemeRegistry.json'

const RPC_URL = process.env.NEXT_PUBLIC_OG_MAINNET_RPC_URL

// Initialize provider
const provider = new ethers.JsonRpcProvider(RPC_URL)
const memeRegistry = new ethers.Contract(MemeRegistryABI.address, MemeRegistryABI.abi, provider)

console.log(memeRegistry,'mr')
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
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const creator = searchParams.get('creator')
    const filter = searchParams.get('filter') || 'trending'

    console.log('Fetching memes from blockchain...', { limit, offset, creator, filter })

    // Get total meme count from contract
    const memeCounter = await memeRegistry.memeCounter()
    console.log(memeCounter,'memecounter')
    const totalMemes = parseInt(memeCounter.toString())
    
    if (totalMemes === 0) {
      return NextResponse.json({
        success: true,
        memes: [],
        pagination: { limit, offset, total: 0 }
      })
    }

    // Fetch memes from blockchain
    const memes: OnChainMeme[] = []
    
    // Calculate range to fetch (newest first)
    const startId = Math.max(1, totalMemes - offset)
    const endId = Math.max(1, startId - limit + 1)

    for (let i = startId; i >= endId; i--) {
      try {
        const memeData = await memeRegistry.getMeme(i)
        
        if (memeData.exists) {
          // Filter by creator if specified
          if (creator && memeData.creator.toLowerCase() !== creator.toLowerCase()) {
            continue
          }

          const meme: OnChainMeme = {
            id: i,
            creator: memeData.creator,
            storageHash: memeData.storageHash,
            imageUrl: memeData.imageUrl,
            caption: memeData.caption,
            prompt: memeData.prompt,
            timestamp: parseInt(memeData.timestamp.toString()),
            likeCount: parseInt(memeData.likeCount.toString()),
            remixCount: parseInt(memeData.remixCount.toString()),
            tipAmount: ethers.formatEther(memeData.tipAmount.toString()),
            isAIGenerated: memeData.isAIGenerated,
            exists: memeData.exists
          }

          memes.push(meme)
        }
      } catch (error) {
        console.warn(`Failed to fetch meme ${i}:`, error)
        // Continue with next meme
      }
    }

    // Apply filters
    let filteredMemes = memes
    
    switch (filter) {
      case 'trending':
        // Sort by engagement (likes + remixes)
        filteredMemes.sort((a, b) => {
          const scoreA = a.likeCount + (a.remixCount * 2)
          const scoreB = b.likeCount + (b.remixCount * 2)
          return scoreB - scoreA
        })
        break
      case 'recent':
        // Already sorted by newest first
        break
      case 'ai':
        filteredMemes = filteredMemes.filter(meme => meme.isAIGenerated)
        break
      case 'top':
        // Sort by tip amount
        filteredMemes.sort((a, b) => parseFloat(b.tipAmount) - parseFloat(a.tipAmount))
        break
    }

    console.log(`Fetched ${filteredMemes.length} memes from blockchain`)

    return NextResponse.json({
      success: true,
      memes: filteredMemes,
      pagination: {
        limit,
        offset,
        total: totalMemes
      }
    })

  } catch (error: any) {
    console.error('Failed to fetch memes from blockchain:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    )
  }
}
