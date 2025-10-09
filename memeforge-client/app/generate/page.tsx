"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card"
import { 
  Upload, 
  Sparkles, 
  Image as ImageIcon,
  Download,
  Share2,
  Repeat
} from "lucide-react"

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [storageHash, setStorageHash] = useState<string | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
    }
  }

  const generateMeme = async () => {
    if (!prompt && !selectedImage) return

    setIsGenerating(true)
    
    // Simulate API call
    setTimeout(() => {
      const mockMemeUrl = `https://picsum.photos/600/400?random=${Math.random()}`
      const mockHash = `0x${Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`
      
      setGeneratedMeme(mockMemeUrl)
      setStorageHash(mockHash)
      setIsGenerating(false)
    }, 2000)
  }

  const downloadMeme = () => {
    if (generatedMeme) {
      const link = document.createElement('a')
      link.href = generatedMeme
      link.download = `meme-${Date.now()}.jpg`
      link.click()
    }
  }

  const shareMeme = async () => {
    if (generatedMeme && storageHash) {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out my meme!',
          text: 'I created this meme using MemeForge',
          url: `${window.location.origin}/meme/${storageHash}`
        })
      } else {
        navigator.clipboard.writeText(`${window.location.origin}/meme/${storageHash}`)
        alert('Link copied to clipboard!')
      }
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">Create</span> Your Meme
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Generate AI-powered memes with text prompts or upload your own image
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="glassmorphism-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-2xl">
                <Sparkles className="h-6 w-6 text-cyan-400" />
                <span>Meme Creation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Text Prompt */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">
                  Text Prompt (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your meme idea... (e.g., 'funny cat wearing sunglasses')"
                  className="w-full h-32 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">
                  Upload Image (Optional)
                </label>
                <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-cyan-400/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400 mb-2">
                      {selectedImage ? selectedImage.name : "Click to upload an image"}
                    </p>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </label>
                </div>
              </div>

              <Button 
                onClick={generateMeme}
                disabled={isGenerating || (!prompt && !selectedImage)}
                variant="premium"
                className="w-full py-6 text-lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Meme
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="glassmorphism-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-2xl">
                <ImageIcon className="h-6 w-6 text-cyan-400" />
                <span>Your Meme</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedMeme ? (
                <>
                  {/* Generated Meme */}
                  <div className="aspect-square rounded-lg overflow-hidden bg-black/20 border border-white/10">
                    <img 
                      src={generatedMeme} 
                      alt="Generated meme"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Storage Hash */}
                  {storageHash && (
                    <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Storage Hash</div>
                      <div className="font-mono text-sm text-cyan-400 break-all">
                        {storageHash}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={downloadMeme}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={shareMeme}
                      className="flex items-center space-x-2"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                    <Button 
                      variant="premium"
                      className="flex items-center space-x-2"
                    >
                      <Repeat className="h-4 w-4" />
                      <span>Remix</span>
                    </Button>
                  </div>

                  {/* Mint NFT Button */}
                  <Button variant="glass" className="w-full py-4">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Mint as NFT on OG Chain
                  </Button>
                </>
              ) : (
                <div className="aspect-square rounded-lg bg-black/20 border border-white/10 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                    <p>Your generated meme will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}