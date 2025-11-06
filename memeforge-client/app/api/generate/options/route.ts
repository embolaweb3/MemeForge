import { NextRequest, NextResponse } from 'next/server'
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";

// OG Inference Official Providers
const OFFICIAL_PROVIDERS = {
  "llama-3.3-70b-instruct": process.env.OG_PROVIDER_LLAMA || "0xf07240Efa67755B5311bc75784a061eDB47165Dd"
};

async function generateMemeCaption(prompt: string) {
  const privateKey = process.env.TESTNET_PRIVATE_KEY;
  const rpcUrl = process.env.NEXT_PUBLIC_OG_TESTNET_RPC_URL || "https://evmrpc-testnet.0g.ai";

  if (!privateKey) {
    throw new Error('PRIVATE_KEY is required for OG services');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  
  try {
    const broker = await createZGComputeNetworkBroker(signer);
    
    const targetProvider = OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
    
    // Acknowledge provider
    try {
      await broker.inference.acknowledgeProviderSigner(targetProvider);
    } catch (ackError) {
      console.log('Provider acknowledgement note:', ackError);
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
        max_tokens: 100,
        temperature: 0.8,
      },
      {
        headers: requestHeaders,
      }
    );
    
    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error("No content received from AI service");
    }

    // Process payment
    try {
      const chatId = completion.id;
      await broker.inference.processResponse(
        targetProvider,
        content,
        chatId
      );
    } catch (paymentError) {
      console.warn("Payment processing failed, but response received");
    }
    
    return content.trim();

  } catch (error: any) {
    console.error('OG Inference error:', error);
    throw new Error(`AI meme generation failed: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, count = 3 } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log('Generating multiple meme options for prompt:', prompt);

    const options: string[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const variationPrompt = `${prompt} - variation ${i + 1}`;
        const result = await generateMemeCaption(variationPrompt);
        options.push(result);
        console.log(`Option ${i + 1}:`, result);
      } catch (error) {
        console.error(`Failed to generate option ${i + 1}:`, error);
        // Continue with other options even if one fails
      }
    }

    const validOptions = options.filter(option => option && option.length > 0);

    if (validOptions.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to generate any meme options' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      options: validOptions,
      count: validOptions.length,
      prompt
    });

  } catch (error: any) {
    console.error('Options generation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}