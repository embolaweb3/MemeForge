import { NextRequest, NextResponse } from 'next/server'

// Mock data - in production, this would come from Supabase
const mockMemes = [
  {
    id: "1",
    imageUrl: "https://picsum.photos/600/400?random=1",
    prompt: "funny cat wearing sunglasses",
    storageHash: "0x1a2b3c4d5e6f7g8h9i0j",
    likes: 1420,
    comments: 89,
    shares: 256,
    creator: "0xabc123...def456",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Simulate database query
    const memes = mockMemes.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      memes,
      pagination: {
        limit,
        offset,
        total: mockMemes.length
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch memes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt, storageHash, creator } = await request.json()

    // Simulate storing in Supabase
    const newMeme = {
      id: (mockMemes.length + 1).toString(),
      imageUrl,
      prompt,
      storageHash,
      likes: 0,
      comments: 0,
      shares: 0,
      creator,
      timestamp: new Date().toISOString()
    }

    mockMemes.unshift(newMeme)

    return NextResponse.json({
      success: true,
      meme: newMeme
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create meme' },
      { status: 500 }
    )
  }
}