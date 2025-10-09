import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers';
import { Indexer } from '@0glabs/0g-ts-sdk';
import fs from 'fs';
import path from 'path';

function initializeOGStorage() {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.NEXT_PUBLIC_OG_TESTNET_RPC_URL || 'https://evmrpc-testnet.0g.ai/';
  const indexerRpc = process.env.NEXT_PUBLIC_OG_INDEXER_RPC || 'https://indexer-storage-testnet-standard.0g.ai';

  if (!privateKey) {
    throw new Error('PRIVATE_KEY is required for OG Storage');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const indexer = new Indexer(indexerRpc);

  return { indexer };
}

export async function POST(request: NextRequest) {
  try {
    const { rootHash } = await request.json()

    if (!rootHash) {
      return NextResponse.json(
        { success: false, error: 'Root hash is required' },
        { status: 400 }
      )
    }

    console.log('Verifying storage for hash:', rootHash);
    const { indexer } = initializeOGStorage();

    try {
      // Try to download a small part of the file to verify existence
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const outputPath = path.join(tempDir, `verify-${rootHash}`);
      const err = await indexer.download(rootHash, outputPath, true);
      
      if (err !== null) {
        return NextResponse.json({
          success: true,
          exists: false,
          rootHash,
          verifiedAt: new Date().toISOString()
        });
      }

      // Clean up verification file
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      return NextResponse.json({
        success: true,
        exists: true,
        rootHash,
        verifiedAt: new Date().toISOString()
      });

    } catch (error) {
      return NextResponse.json({
        success: true,
        exists: false,
        rootHash,
        verifiedAt: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('Verification failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}