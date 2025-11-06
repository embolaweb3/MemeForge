import { NextRequest, NextResponse } from 'next/server'
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";
import { ZgFile, Indexer } from '@0glabs/0g-ts-sdk';
import fs from 'fs';
import path from 'path';

// OG Inference Official Providers
const OFFICIAL_PROVIDERS = {
  "llama-3.3-70b-instruct": process.env.OG_PROVIDER_LLAMA || "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
  "deepseek-r1-70b": process.env.OG_PROVIDER_DEEPSEEK || "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3",
};

// Initialize OG Services
function initializeOGServices() {
  const privateKey = process.env.PRIVATE_KEY;
  const testPrivateKey = process.env.TESTNET_PRIVATE_KEY;
  const mainnet_rpcUrl = 'https://evmrpc.0g.ai';
  const mainnet_indexerRpc = 'https://indexer-storage-turbo.0g.ai';
  const testnet_rpcUrl = 'https://evmrpc-testnet.0g.ai'
  const testnet_indexerRpc = 'https://indexer-storage-testnet-turbo.0g.ai'

  if (!privateKey || !testPrivateKey) {
    throw new Error('PRIVATE_KEY is required for OG services');
  }

  const testnet_provider = new ethers.JsonRpcProvider(testnet_rpcUrl);
  const mainnet_provider = new ethers.JsonRpcProvider(mainnet_rpcUrl);
  const testnet_signer = new ethers.Wallet(testPrivateKey, testnet_provider);
  const mainnet_signer = new ethers.Wallet(privateKey, mainnet_provider);
  const indexer = new Indexer(mainnet_indexerRpc);

  return { testnet_provider,mainnet_provider,mainnet_indexerRpc, testnet_signer,mainnet_signer, indexer,testnet_rpcUrl,mainnet_rpcUrl };
}

// Generate meme caption using OG Inference
async function generateMemeCaption(prompt: string) {
  const { testnet_provider, testnet_signer } = initializeOGServices();
  
  try {
    console.log('Initializing OG Inference broker...');
    const broker = await createZGComputeNetworkBroker(testnet_signer);
    
    const targetProvider = OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
    console.log(targetProvider)
    // Acknowledge provider
    try {
      await broker.inference.acknowledgeProviderSigner(targetProvider);
      console.log('Provider acknowledged');
    } catch (ackError) {
      console.log('Provider already acknowledged or acknowledgement failed');
    }

    // Get service metadata
    const { endpoint, model } = await broker.inference.getServiceMetadata(targetProvider);
    
    // Create enhanced prompt for meme generation
    const memePrompt = `Create a funny meme caption about: "${prompt}". 
    The caption should be humorous, viral-worthy, and under 100 characters. 
    Return ONLY the caption text, no explanations.`;
    
    // Get headers for authentication
    const headers = await broker.inference.getRequestHeaders(targetProvider, memePrompt);
    
    // Create OpenAI client
    const openai = new OpenAI({
      baseURL: endpoint,
      apiKey: "",
    });
    
    // Prepare headers
    const requestHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        requestHeaders[key] = value;
      }
    });
    
    // Make API request
    const completion = await openai.chat.completions.create(
      {
        messages: [{ role: "user", content: memePrompt }],
        model,
      },
      {
        headers: requestHeaders,
      }
    );
    
    console.log(completion,'comp')
    const content = completion.choices[0].message.content;
    const chatId = completion.id;
    
    if (!content) {
      throw new Error("No content received from AI service");
    }

    // Process payment
    try {
      const isValid = await broker.inference.processResponse(
        targetProvider,
        content,
        chatId
      );
      
      console.log('Payment processed successfully, valid:', isValid);
      
      return {
        content: content.trim(),
        metadata: {
          model,
          isValid,
          provider: targetProvider,
          chatId,
        }
      };
    } catch (paymentError: any) {
      console.warn("Payment processing failed, but response received:", paymentError.message);
      
      return {
        content: content.trim(),
        metadata: {
          model,
          isValid: false,
          provider: targetProvider,
          chatId,
          paymentError: paymentError.message,
        }
      };
    }
  } catch (error: any) {
    console.error('OG Inference error:', error);
    throw new Error(`AI meme generation failed: ${error.message}`);
  }
}

// Upload to OG Storage
async function uploadToOGStorage(buffer: Buffer, fileName: string) {
  const { mainnet_provider, mainnet_signer, indexer,mainnet_rpcUrl } = initializeOGServices();

  try {
    console.log(`Uploading to OG Storage: ${fileName}, size: ${buffer.length} bytes`);

    // Create temporary file for upload
    const tempDir = '/tmp'
    // if (!fs.existsSync(tempDir)) {
    //   fs.mkdirSync(tempDir, { recursive: true });
    // }

    const tempFilePath = path.join(tempDir, `${Date.now()}-${fileName}`);
    fs.writeFileSync(tempFilePath, buffer);

    // Create ZgFile from file path
    const zgFile = await ZgFile.fromFilePath(tempFilePath);
    const [tree, treeErr] = await zgFile.merkleTree();
    
    if (treeErr !== null) {
      throw new Error(`Error generating Merkle tree: ${treeErr}`);
    }

    if (!tree) {
      throw new Error('Failed to generate Merkle tree');
    }

    // Upload file to OG Storage
    const [tx, uploadErr] = await indexer.upload(zgFile, mainnet_rpcUrl, mainnet_signer as any);

    console.log('OG Storage Upload - Transaction Hash:', tx);
    if (uploadErr !== null) {
      throw new Error(`Upload error: ${uploadErr}`);
    }

    await zgFile.close();

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    const rootHash = tree.rootHash();
    
    console.log('✅ OG Storage upload successful');
    console.log('Root Hash:', rootHash);

    return {
      rootHash,
      transactionHash: tx,
      url: `https://og-storage.com/file/${rootHash}`
    };

  } catch (error: any) {
    console.error('❌ OG Storage upload failed:', error);
    throw new Error(`OG Storage upload failed: ${error.message}`);
  }
}

// Generate meme image
async function generateMemeImage(baseImageUrl: string | null, caption: string): Promise<Buffer> {
  try {
    let imageBuffer: Buffer;

    if (baseImageUrl && baseImageUrl.startsWith('data:')) {
      // Convert base64 to buffer
      const base64Data = baseImageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (baseImageUrl) {
      // Fetch image from URL
      const response = await fetch(baseImageUrl);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      // Generate a placeholder meme using a simple API
      const encodedCaption = encodeURIComponent(caption);
      const memeUrl = `https://api.memegen.link/images/custom/_/${encodedCaption}.png?background=https://i.imgur.com/8x7WQ1a.png`;
      
      const response = await fetch(memeUrl);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    return imageBuffer;

  } catch (error: any) {
    console.error('❌ Meme image generation failed:', error);
    throw new Error(`Meme image generation failed: ${error.message}`);
  }
}

// Generate storage hash
function generateMemeHash(): string {
  return `0x${Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, image, creator } = await request.json()

    if (!prompt && !image) {
      return NextResponse.json(
        { success: false, error: 'Prompt or image is required' },
        { status: 400 }
      )
    }

    console.log('🚀 Starting REAL meme generation process...');
    console.log('Prompt:', prompt);
    console.log('Creator:', creator);
    console.log('Has image:', !!image);

    let memeCaption = '';
    let finalImageBuffer: Buffer;
    let imageStorageResult: any = null;
    let metadataStorageResult: any = null;

    // Step 1: Generate meme caption using REAL OG Inference
    if (prompt) {
      try {
        console.log('🧠 Generating meme caption with OG Inference...');
        
        const aiResult = await generateMemeCaption(prompt);
        memeCaption = aiResult.content;
        
        console.log('✅ OG Inference successful - Caption:', memeCaption);
        console.log('AI Metadata:', aiResult.metadata);

      } catch (error: any) {
        console.error('❌ OG Inference failed:', error);
        
        return NextResponse.json(
          { 
            success: false, 
            error: `AI service unavailable: ${error.message}`,
            suggestion: 'Please try again in a few moments or use an image upload instead'
          },
          { status: 503 }
        );
      }
    } else {
      // If no prompt provided, use a default caption for image memes
      memeCaption = "Check out this meme!";
    }

    // Step 2: Generate meme image
    try {
      console.log('🎨 Generating meme image...');
      
      finalImageBuffer = await generateMemeImage(image, memeCaption);
      
      console.log('✅ Meme image generated - Size:', finalImageBuffer.length, 'bytes');

    } catch (error: any) {
      console.error('❌ Meme image generation failed:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Image processing failed: ${error.message}` 
        },
        { status: 500 }
      );
    }

    // Step 3: Store image on REAL OG Storage
    try {
      console.log('💾 Uploading image to OG Storage...');
      
      imageStorageResult = await uploadToOGStorage(
        finalImageBuffer, 
        `meme-${Date.now()}.png`
      );
      
      console.log('✅ OG Storage image upload successful');
      console.log('Image Root Hash:', imageStorageResult.rootHash);
      console.log('Transaction Hash:', imageStorageResult.transactionHash);

    } catch (error: any) {
      console.error('❌ OG Storage image upload failed:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Image storage failed: ${error.message}`,
          suggestion: 'Your meme was created but could not be stored permanently. Please try again.'
        },
        { status: 507 }
      );
    }

    // Step 4: Store metadata on REAL OG Storage
    try {
      console.log('📝 Uploading metadata to OG Storage...');
      
      const metadata = {
        prompt: prompt || 'Image upload',
        caption: memeCaption,
        creator: creator || 'anonymous',
        timestamp: new Date().toISOString(),
        imageRootHash: imageStorageResult.rootHash,
        imageTransactionHash: imageStorageResult.transactionHash,
        aiGenerated: !!prompt,
        aiModel: prompt ? 'OG Inference' : 'User upload',
        version: '1.0',
        platform: 'MemeForge'
      };
      
      const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2), 'utf-8');
      metadataStorageResult = await uploadToOGStorage(metadataBuffer, `metadata-${Date.now()}.json`);
      
      console.log('✅ Metadata upload successful');
      console.log('Metadata Root Hash:', metadataStorageResult.rootHash);

    } catch (error: any) {
      console.error('❌ OG Storage metadata upload failed:', error);
      console.log('⚠️ Metadata storage failed, but image was stored successfully');
    }

    // Convert image buffer to data URL for frontend display
    const dataUrl = `data:image/png;base64,${finalImageBuffer.toString('base64')}`;

    // Step 5: Return successful response
    const responseData = {
      success: true,
      memeUrl: dataUrl,
      storageHash: imageStorageResult.rootHash,
      transactionHash: imageStorageResult.transactionHash,
      metadataHash: metadataStorageResult?.rootHash,
      caption: memeCaption,
      message: 'Meme generated and permanently stored on OG Storage',
      verification: {
        image: `https://og-scan.com/tx/${imageStorageResult.transactionHash}`,
        storage: `https://og-storage.com/file/${imageStorageResult.rootHash}`
      },
      timestamp: new Date().toISOString()
    };

    console.log('🎉 REAL Meme generation completed successfully!');
    console.log('Response data:', responseData);

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('💥 Generate API catastrophic error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Generation failed: ${error.message}`,
        code: 'GENERATION_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}