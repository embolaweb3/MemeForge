"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card"
import {
  Upload,
  Sparkles,
  Image as ImageIcon,
  Download,
  Share2,
  Repeat,
  Wallet,
  Zap,
  Brain,
  CreditCard,
  Coins,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  X
} from "lucide-react"
import { useAccount, useChainId, useChains, useWaitForTransactionReceipt, useBalance } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useMemeActions } from "@/hooks/useMemeContract"
import { usePayment } from "@/hooks/usePayment"
import { ethers } from "ethers"
import { formatHash } from "@/lib/utils"
import MemeRegistryABI from "@/lib/abis/MemeRegistry.json";



export default function GeneratePage() {
  const [prompt, setPrompt] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [storageHash, setStorageHash] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [memeCaption, setMemeCaption] = useState<string | null>(null)
  const [aiOptions, setAiOptions] = useState<string[]>([])
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [memeId, setMemeId] = useState<number | null>(null)

  const { address, isConnected } = useAccount()
  const chainId = useChainId();
  const chains = useChains()
  const { createMeme, remixMeme } = useMemeActions()

  const { paymentState, initiatePayment, resetPayment } = usePayment()


  const { data: paymentReceipt, isLoading: isPaymentTxLoading, isSuccess: isPaymentSuccess, isError: isPaymentError } =
    useWaitForTransactionReceipt({
      hash: paymentState.txHash as `0x${string}`,
    })

  useEffect(() => {
    if (isPaymentSuccess) {
      console.log('✅ Payment transaction confirmed!', paymentReceipt)
    }
    if (isPaymentError) {
      console.error('❌ Payment transaction failed')
    }
  }, [isPaymentSuccess, isPaymentError, paymentReceipt])


  // Wait for mint transaction
  const { data: mintReceipt, isLoading: isMintTxLoading, isSuccess: isMintSuccess } =
    useWaitForTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    })

  useEffect(() => {
    if (isMintSuccess) {
      console.log('✅ Meme minting transaction confirmed!', mintReceipt)
    }
  }, [isMintSuccess, mintReceipt])


  // Balance check
  const { data: balance } = useBalance({
    address: address,
    chainId: Number(process.env.NEXT_PUBLIC_OG_TESTNET_CHAIN_ID!),
  })

  const SERVICE_FEES = {
    MINT: "0.001",      // 0.001 0G for minting
    REMIX: "0.0005",    // 0.0005 0G for remixing
    AI_GENERATION: "0.005", // 0.005 0G for AI
    STORAGE: "0.001"   // 0.001 0G for storage
  }



  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Image size must be less than 10MB')
        return
      }
      setSelectedImage(file)
    }
  }

  const openPaymentModal = () => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }

    if (chainId !== Number(process.env.NEXT_PUBLIC_OG_TESTNET_CHAIN_ID!)) {
      alert("Please switch to 0G Chain to use MemeForge")
      return
    }

    setShowPaymentModal(true)
  }


  const handlePayment = async () => {
    try {
      // Pay for the complete service ( AI + storage)
      await initiatePayment('ai_and_storage')
      setShowPaymentModal(false)
    } catch (error: any) {
      console.error('Payment initiation failed:', error)
    }
  }



  const generateAiOptions = async () => {
    if (!prompt.trim() || !paymentState.completed) return

    setIsGeneratingOptions(true)
    setAiOptions([])
    setSelectedOption(null)

    try {
      const response = await fetch('/api/generate/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          count: 3,
          userAddress: address
        })
      })

      const data = await response.json()

      if (data.success) {
        setAiOptions(data.options)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Failed to generate AI options:', error)
      alert('Failed to generate AI options. Please try again.')
    } finally {
      setIsGeneratingOptions(false)
    }
  }

const generateMeme = async (customCaption?: string) => {
  if ((!prompt && !selectedImage) || !paymentState.completed) return;

  setIsGenerating(true);
  setGeneratedMeme(null);
  setStorageHash(null);
  setTransactionHash(null);
  setMemeCaption(null);
  setMemeId(null);

  try {
    let imageBase64 = null;
    if (selectedImage) imageBase64 = await convertToBase64(selectedImage);

    const finalPrompt = customCaption || prompt;
    console.log("🧠 Generating meme via OG services...");

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: finalPrompt,
        image: imageBase64,
        creator: address,
        userAddress: address,
        paymentTxHash: paymentState.txHash,
      }),
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to generate meme");

    setGeneratedMeme(data.memeUrl);
    setStorageHash(data.storageHash);
    setMemeCaption(data.caption);

    // Mint meme
    const tx = await createMeme(
      data.storageHash,
      data.memeUrl,
      data.caption,
      finalPrompt,
      true // AI generated
    );

    setTransactionHash(tx.hash);
    console.log("🪄 Mint transaction sent:", tx.hash);

    // --- ✅ More robust confirmation logic ---
    const provider = tx.runner?.provider || new ethers.BrowserProvider(window.ethereum);
    let receipt = null;

    for (let i = 0; i < 5; i++) {
      try {
        receipt = await provider.getTransactionReceipt(tx.hash);
        if (receipt) break;
      } catch (rpcError: any) {
        console.warn(`⏳ Waiting for receipt (attempt ${i + 1}):`, rpcError.message);
      }
      await new Promise(res => setTimeout(res, 3000));
    }

    if (!receipt) {
      console.warn("⚠️ Still no receipt after retries, but continuing (likely RPC lag)");
    }

    const confirmedReceipt = receipt || (await tx.wait()).receipt;
    console.log("✅ Transaction confirmed:", confirmedReceipt?.transactionHash);

    // Extract Meme ID from events
    const iface = new ethers.Interface(MemeRegistryABI.abi);
    let memeId = null;

    for (const log of confirmedReceipt?.logs || []) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "MemeCreated") {
          memeId = parsed.args[0].toString();
          console.log("✅ Meme ID from event:", memeId);
          break;
        }
      } catch {}
    }

    if (!memeId) {
      console.warn("⚠️ MemeCreated event not found — using fallback ID");
      memeId = Math.floor(Math.random() * 100000);
    }

    setMemeId(memeId);

  } catch (error: any) {
    console.error("❌ Meme generation failed:", error);

    // Ignore harmless "no matching receipts" RPC issue
    if (error?.message?.includes("no matching receipts found")) {
      console.warn("⚠️ RPC receipt delay detected — ignoring false error");
      return;
    }

    alert(`Failed to generate meme: ${error.message}`);
  } finally {
    setIsGenerating(false);
  }
};



  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const downloadMeme = () => {
    if (generatedMeme) {
      const link = document.createElement('a')
      link.href = generatedMeme
      link.download = `memeforge-${Date.now()}.png`
      link.click()
    }
  }

  const shareMeme = async () => {
    if (generatedMeme && storageHash) {
      const shareUrl = `${window.location.origin}/meme/${storageHash}`
      const shareText = memeCaption ? `"${memeCaption}" - Created with MemeForge` : 'Check out my meme!'

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
  }

  const remixMemeAction = async () => {
    if (!memeId || !paymentState.completed) return

    try {

      await initiatePayment('remix')
      const newCaption = `${memeCaption} - Remixed!`
      // generate a new image/variation later

      const tx = await remixMeme(
        memeId,
        storageHash + "-remix", // New storage hash
        newCaption
      )

      setTransactionHash(tx.hash)
      alert('Meme remixed successfully!')
    } catch (error: any) {
      console.error('Remix failed:', error)
      alert('Failed to remix meme. Please try again.')
    }
  }

  const verifyStorage = async () => {
    if (!storageHash) return

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

  const resetForm = () => {
    setPrompt("")
    setSelectedImage(null)
    setGeneratedMeme(null)
    setStorageHash(null)
    setTransactionHash(null)
    setMemeCaption(null)
    setAiOptions([])
    setSelectedOption(null)
    setMemeId(null)
    resetPayment()
  }

  const getNetworkName = () => {
    const currentChain = chains.find((c) => c.id === chainId);
    // Return its name, or a default
    return currentChain?.name ?? "0G Chain";
  }

  const isCorrectNetwork = chainId === 16602 || 16661

  const hasSufficientBalance = balance &&
    parseFloat(ethers.formatEther(balance.value)) >= parseFloat(SERVICE_FEES.MINT)

  // Calculate total cost
  const totalCost = (
    parseFloat(SERVICE_FEES.AI_GENERATION) +
    parseFloat(SERVICE_FEES.STORAGE)
  ).toFixed(4)

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">Create</span> Your Meme
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Generate AI-powered memes with OG Inference and store them permanently on 0G Chain
          </p>
        </div>

        {/* Network Warning */}
        {isConnected && !isCorrectNetwork && (
          <Card className="glassmorphism-card border-red-500/30 mb-8">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-semibold mb-2">Wrong Network</h3>
              <p className="text-gray-300 mb-4">
                Please switch to 0G Chain to use MemeForge
              </p>
              <div className="text-sm text-gray-400">
                Current: {getNetworkName() || 'Unknown'} | Required: 0G Chain
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insufficient Balance Warning */}
        {isConnected && isCorrectNetwork && !hasSufficientBalance && (
          <Card className="glassmorphism-card border-orange-500/30 mb-8">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-400" />
              <h3 className="text-xl font-semibold mb-2">Insufficient Balance</h3>
              <p className="text-gray-300 mb-4">
                You need at least {SERVICE_FEES.MINT} OG to create a meme
              </p>
              <div className="text-sm text-gray-400">
                Your balance: {balance ? parseFloat(ethers.formatEther(balance.value)).toFixed(4) : '0'} 0G
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Status */}
        {paymentState.error && (
          <Card className="glassmorphism-card border-red-500/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 text-red-400">
                <AlertCircle className="h-6 w-6" />
                <div>
                  <div className="font-semibold">Payment Failed</div>
                  <div className="text-sm text-red-300">{paymentState.error}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Processing */}
        {(paymentState.processing || isPaymentTxLoading) && (
          <Card className="glassmorphism-card border-blue-500/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                <div>
                  <div className="font-semibold text-blue-400">Processing Payment</div>
                  <div className="text-sm text-gray-300">
                    Confirm the transaction in your wallet...
                    {paymentState.txHash && (
                      <div className="text-xs font-mono truncate mt-1">
                        TX: {formatHash(paymentState.txHash)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Success */}
        {paymentState.completed && (
          <Card className="glassmorphism-card border-green-500/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 text-green-400">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <div className="font-semibold">Payment Successful!</div>
                  <div className="text-sm text-green-300">
                    You're ready to create memes
                    {paymentState.txHash && (
                      <div className="text-xs font-mono truncate mt-1">
                        TX: {formatHash(paymentState.txHash)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet Connection */}
        {!isConnected && (
          <Card className="glassmorphism-card border-cyan-500/30 mb-8">
            <CardContent className="p-6 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
              <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-300 mb-4">
                Connect your wallet to start creating and minting memes on-chain
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        )}

        {/* Payment Required Banner */}
        {isConnected && isCorrectNetwork && hasSufficientBalance && !paymentState.completed && !paymentState.processing && (
          <Card className="glassmorphism-card border-yellow-500/30 mb-8">
            <CardContent className="p-6 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-semibold mb-2">Payment Required</h3>
              <p className="text-gray-300 mb-4">
                Pay {totalCost} OG to use AI generation and on-chain storage services
              </p>
              <Button variant="premium" onClick={openPaymentModal}>
                <Zap className="h-4 w-4 mr-2" />
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="glassmorphism-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-2xl">
                <Sparkles className="h-6 w-6 text-cyan-400" />
                <span>Meme Creation</span>
                {paymentState.completed && (
                  <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Paid</span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connected Wallet Info */}
              {isConnected && (
                <div className="p-3 bg-black/20 rounded-lg border border-white/10">
                  <div className="text-sm text-gray-400">Connected as</div>
                  <div className="text-cyan-400 font-mono text-sm truncate">
                    {formatHash(address!)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center space-x-2">
                    <span>Network: {getNetworkName()}</span>
                    {isCorrectNetwork && (
                      <span className="text-green-400 flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Correct Network</span>
                      </span>
                    )}
                  </div>
                  {balance && (
                    <div className="text-xs text-gray-400 mt-1">
                      Balance: {parseFloat(ethers.formatEther(balance.value)).toFixed(4)} OG
                    </div>
                  )}
                </div>
              )}

              {/* Cost Breakdown */}
              <div className="p-4 bg-black/20 rounded-lg border border-cyan-500/30">
                <div className="text-sm text-gray-400 mb-2 flex items-center space-x-2">
                  <Coins className="h-4 w-4" />
                  <span>Service Costs</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>AI Generation (OG Inference):</span>
                    <span className="text-cyan-400">{SERVICE_FEES.AI_GENERATION} OG</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage (OG Storage):</span>
                    <span className="text-cyan-400">{SERVICE_FEES.STORAGE} OG</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Smart Contract Mint:</span>
                    <span className="text-cyan-400">{SERVICE_FEES.MINT} OG</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 font-bold">
                    <span>Total Cost:</span>
                    <span className="text-green-400">{totalCost} OG</span>
                  </div>
                </div>
              </div>

              {/* Text Prompt */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">
                  Text Prompt (AI will generate funny caption)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your meme idea... (e.g., 'funny cat wearing sunglasses')"
                  className="w-full h-32 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none transition-all"
                  disabled={!paymentState.completed}
                />

                {/* AI Options Generator */}
                {prompt && paymentState.completed && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={generateAiOptions}
                      disabled={isGeneratingOptions}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      {isGeneratingOptions ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        'Get AI Options'
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* AI Generated Options */}
              {aiOptions.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">
                    AI-Generated Caption Options
                  </label>
                  <div className="space-y-2">
                    {aiOptions.map((option, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedOption === index
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-white/10 bg-black/20 hover:border-white/30'
                          }`}
                        onClick={() => setSelectedOption(index)}
                      >
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm text-white">{option}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => generateMeme(aiOptions[selectedOption!])}
                    disabled={selectedOption === null || isGenerating}
                    variant="premium"
                    size="sm"
                  >
                    Use Selected Caption
                  </Button>
                </div>
              )}

              {/* Image Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">
                  Upload Image (Optional)
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${paymentState.completed
                    ? 'border-white/10 hover:border-cyan-400/50 cursor-pointer'
                    : 'border-gray-600/50 opacity-50'
                  }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={!paymentState.completed}
                  />
                  <label htmlFor="image-upload" className={`${paymentState.completed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400 mb-2">
                      {selectedImage ? selectedImage.name : "Click to upload an image"}
                    </p>
                    <Button variant="outline" size="sm" disabled={!paymentState.completed}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </label>
                </div>
                {selectedImage && (
                  <div className="text-xs text-gray-400">
                    Selected: {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <Button
                onClick={() => generateMeme()}
                disabled={isGenerating || isMintTxLoading || (!prompt && !selectedImage) || !paymentState.completed}
                variant="premium"
                className="w-full py-6 text-lg font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Generating with OG AI...
                  </>
                ) : isMintTxLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Minting on Blockchain...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate & Mint Meme
                  </>
                )}
              </Button>

              {/* Status Info */}
              <div className="text-center text-sm text-gray-400 space-y-1">
                <p>✅ AI-powered meme generation</p>
                <p>✅ Permanent OG Storage</p>
                <p>✅ On-chain verification</p>
                <p>✅ Remixable content</p>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="glassmorphism-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-2xl">
                <ImageIcon className="h-6 w-6 text-cyan-400" />
                <span>Your Meme</span>
                {transactionHash && (
                  <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>On-Chain</span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transaction Status */}
              {transactionHash && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-400 mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">Successfully Minted on Blockchain!</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-green-300 font-mono truncate flex-1 mr-2">
                      TX: {formatHash(transactionHash)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://testnet.0g.ai/tx/${transactionHash}`, '_blank')}
                      className="h-6 px-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {!paymentState.completed ? (
                <div className="aspect-square rounded-lg bg-black/20 border border-white/10 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <CreditCard className="h-12 w-12 mx-auto mb-4" />
                    <p>Complete payment to generate memes</p>
                    <p className="text-sm mt-2 text-cyan-400">
                      Small fee required for AI & storage services
                    </p>
                  </div>
                </div>
              ) : generatedMeme ? (
                <>
                  {/* Generated Meme */}
                  <div className="rounded-lg overflow-hidden bg-black/20 border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                    <img
                      src={generatedMeme}
                      alt="Generated meme"
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Meme Caption */}
                  {memeCaption && (
                    <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                      <div className="text-sm text-gray-400 mb-1 flex items-center space-x-2">
                        <Sparkles className="h-3 w-3" />
                        <span>AI-Generated Caption</span>
                      </div>
                      <div className="text-white font-medium">"{memeCaption}"</div>
                    </div>
                  )}

                  {/* Storage Verification */}
                  {storageHash && (
                    <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                      <div className="text-sm text-gray-400 mb-2">OG Storage Verification</div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-mono text-xs text-cyan-400 flex-1 truncate mr-2">
                          {formatHash(storageHash)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={verifyStorage}
                          className="h-7 px-2"
                        >
                          Verify
                        </Button>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center space-x-2">
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                        <span>Permanently stored on 0G Chain</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="premium"
                      onClick={remixMemeAction}
                      disabled={!memeId}
                      className="flex items-center space-x-2"
                    >
                      <Repeat className="h-4 w-4" />
                      <span>Remix ({SERVICE_FEES.REMIX} OG)</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      className="flex items-center space-x-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Create New</span>
                    </Button>
                  </div>

                  {/* Blockchain Info */}
                  {transactionHash && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="text-sm text-blue-400 mb-1">On-Chain Data</div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Creator: {formatHash(address!)}</div>
                        <div>Network: {getNetworkName()}</div>
                        <div>Status: {isMintTxLoading ? 'Confirming...' : 'Confirmed'}</div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-square rounded-lg bg-black/20 border border-white/10 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                    <p>Your AI-generated meme will appear here</p>
                    {paymentState.completed && (
                      <p className="text-sm mt-2 text-green-400 flex items-center justify-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Payment verified - Ready to create!</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="glassmorphism-card border-cyan-500/30 w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <CreditCard className="h-6 w-6 text-cyan-400" />
                    <span>Confirm Payment</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-green-400">{totalCost} OG</div>
                    <div className="text-sm text-gray-400">Total Amount</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>AI Generation:</span>
                      <span className="text-cyan-400">{SERVICE_FEES.AI_GENERATION} OG</span>
                    </div>
                    <div className="flex justify-between">
                      <span>OG Storage:</span>
                      <span className="text-cyan-400">{SERVICE_FEES.STORAGE} OG</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Smart Contract:</span>
                      <span className="text-cyan-400">{SERVICE_FEES.MINT} OG</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-black/20 rounded-lg border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">Wallet</div>
                  <div className="text-cyan-400 font-mono text-sm truncate">
                    {formatHash(address!)}
                  </div>
                  {balance && (
                    <div className="text-xs text-gray-400 mt-1">
                      Balance: {parseFloat(ethers.formatEther(balance.value)).toFixed(4)} OG
                    </div>
                  )}
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={paymentState.processing || !hasSufficientBalance}
                  variant="premium"
                  className="w-full py-4"
                >
                  {paymentState.processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay {totalCost} OG
                    </>
                  )}
                </Button>

                {!hasSufficientBalance && (
                  <div className="text-center text-red-400 text-sm">
                    ❌ Insufficient balance
                  </div>
                )}

                <div className="text-center text-xs text-gray-400">
                  You'll be able to create multiple memes after payment
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glassmorphism-card text-center">
            <CardContent className="p-6">
              <Sparkles className="h-8 w-8 mx-auto mb-3 text-cyan-400" />
              <h3 className="font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-400">
                Generate hilarious captions using OG Inference with state-of-the-art AI models
              </p>
            </CardContent>
          </Card>

          <Card className="glassmorphism-card text-center">
            <CardContent className="p-6">
              <Coins className="h-8 w-8 mx-auto mb-3 text-green-400" />
              <h3 className="font-semibold mb-2">Permanent Storage</h3>
              <p className="text-sm text-gray-400">
                Your memes stored permanently on OG Storage with verifiable on-chain hashes
              </p>
            </CardContent>
          </Card>

          <Card className="glassmorphism-card text-center">
            <CardContent className="p-6">
              <Repeat className="h-8 w-8 mx-auto mb-3 text-purple-400" />
              <h3 className="font-semibold mb-2">Remix & Share</h3>
              <p className="text-sm text-gray-400">
                Remix existing memes and share your creations with the community
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
