import { useEffect, useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { ethers } from "ethers";
import MemeRegistryABI from "@/lib/abis/MemeRegistry.json";
import PaymentHandlerABI from "@/lib/abis/PaymentHandler.json";

const MEME_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_MEME_REGISTRY_ADDRESS as `0x${string}`;
const PAYMENT_HANDLER_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_HANDLER_ADDRESS as `0x${string}`;

export function useMemeRegistry() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    if (walletClient) {
      provider.getSigner().then((signer) => {
        setContract(new ethers.Contract(MEME_REGISTRY_ADDRESS, MemeRegistryABI.abi, signer));
      });
    } else {
      setContract(new ethers.Contract(MEME_REGISTRY_ADDRESS, MemeRegistryABI.abi, provider));
    }
  }, [walletClient]);

  return contract;
}

export function usePaymentHandler() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    if (walletClient) {
      provider.getSigner().then((signer) => {
        setContract(new ethers.Contract(PAYMENT_HANDLER_ADDRESS, PaymentHandlerABI.abi, signer));
      });
    } else {
      setContract(new ethers.Contract(PAYMENT_HANDLER_ADDRESS, PaymentHandlerABI.abi, provider));
    }
  }, [walletClient]);

  return contract;
}

export function useMemeActions() {
  const memeRegistry = useMemeRegistry();
  const paymentHandler = usePaymentHandler();

  const createMeme = async (
    storageHash: string,
    imageUrl: string,
    caption: string,
    prompt: string,
    isAIGenerated: boolean
  ) => {
    if (!memeRegistry || !paymentHandler) throw new Error("Contracts not ready");

    const paymentTx = await paymentHandler.payForService("mint", {
      value: ethers.parseEther("0.001"),
    });
    await paymentTx.wait();

    const tx = await memeRegistry.createMeme(
      storageHash,
      imageUrl,
      caption,
      prompt,
      isAIGenerated,
      { value: ethers.parseEther("0.001") }
    );

    return await tx.wait();
  };

  const remixMeme = async (
    originalMemeId: number,
    newStorageHash: string,
    newCaption: string
  ) => {
    if (!memeRegistry) throw new Error("Contract not initialized");

    const tx = await memeRegistry.remixMeme(originalMemeId, newStorageHash, newCaption, {
      value: ethers.parseEther("0.0005"),
    });
    return await tx.wait();
  };

  const likeMeme = async (memeId: number) => {
    if (!memeRegistry) throw new Error("Contract not initialized");
    const tx = await memeRegistry.likeMeme(memeId);
    return await tx.wait();
  };

  const tipCreator = async (memeId: number, amount: string) => {
    if (!memeRegistry) throw new Error("Contract not initialized");
    const tx = await memeRegistry.tipCreator(memeId, { value: ethers.parseEther(amount) });
    return await tx.wait();
  };

  const getMemeDetails = async (memeId: number) => {
    if (!memeRegistry) throw new Error("Contract not initialized");
    return await memeRegistry.getMeme(memeId);
  };

  const getUserMemes = async (userAddress: string) => {
    if (!memeRegistry) throw new Error("Contract not initialized");
    return await memeRegistry.getUserMemes(userAddress);
  };

  return { createMeme, remixMeme, likeMeme, tipCreator, getMemeDetails, getUserMemes };
}
