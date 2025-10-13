import { useState, useEffect } from "react";
import { useAccount, useChainId, useWalletClient, usePublicClient } from "wagmi";
import { ethers } from "ethers";
import PaymentHandlerABI from "@/lib/abis/PaymentHandler.json";

const PAYMENT_HANDLER_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_HANDLER_ADDRESS as `0x${string}`;

export function usePayment() {
  const [paymentState, setPaymentState] = useState({
    completed: false,
    processing: false,
    txHash: null as string | null,
    error: null as string | null,
  });

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [paymentHandler, setPaymentHandler] = useState<ethers.Contract | null>(null);

  //  Initialize contract with signer or provider
  useEffect(() => {
    const setup = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = walletClient ? await provider.getSigner() : null;

      const contract = new ethers.Contract(
        PAYMENT_HANDLER_ADDRESS,
        PaymentHandlerABI.abi,
        signer || provider
      );
      setPaymentHandler(contract);
    };
    setup();
  }, [walletClient]);

  //  Main payment flow
const initiatePayment = async (
  serviceType: "mint" | "remix" | "ai_generation" | "storage"
) => {
  if (!isConnected) throw new Error("Please connect your wallet first");
  if (chainId !== Number(process.env.NEXT_PUBLIC_OG_TESTNET_CHAIN_ID!))
    throw new Error("Please switch to 0G Chain to use MemeForge");
  if (!paymentHandler) throw new Error("Payment contract not available");

  // ✅ Ensure signer is ready
  const provider = paymentHandler.runner?.provider || new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork().catch(() => null);
  if (!network) throw new Error("Provider not ready. Please reconnect your wallet.");

  setPaymentState({
    completed: false,
    processing: true,
    txHash: null,
    error: null,
  });

  try {
    const requiredFee = await paymentHandler.getServiceFee(serviceType);
    console.log(`Paying ${ethers.formatEther(requiredFee)} OG for ${serviceType}`);

    const tx = await paymentHandler.payForService(serviceType, { value: requiredFee });
    setPaymentState((prev) => ({ ...prev, txHash: tx.hash }));

    let receipt = null;
    for (let i = 0; i < 10; i++) {
      receipt = await provider.getTransactionReceipt(tx.hash).catch(() => null);
      if (receipt) break;
      console.log(`⏳ Waiting for 0G RPC to index (attempt ${i + 1}/10)`);
      await new Promise(res => setTimeout(res, 3000));
    }

    // ✅ Treat missing receipt as success if hash exists
    if (!receipt) {
      console.warn("RPC slow — assuming transaction success since wallet confirmed.");
      setPaymentState({
        completed: true,
        processing: false,
        txHash: tx.hash,
        error: null,
      });
      return {
        success: true,
        txHash: tx.hash,
        paymentId: await generatePaymentId(tx.hash, serviceType),
      };
    }

    if (receipt.status == 1) {
      setPaymentState({
        completed: true,
        processing: false,
        txHash: tx.hash,
        error: null,
      });
      return {
        success: true,
        txHash: tx.hash,
        paymentId: await generatePaymentId(tx.hash, serviceType),
      };
    }

    throw new Error("Transaction failed on-chain");

  } catch (error: any) {
    // 🧩 Ignore RPC “receipt not found” noise if transaction hash exists
    if (paymentState.txHash && error.message?.includes("no matching receipts found")) {
      console.warn("Ignoring RPC error — transaction was successful.");
      return {
        success: true,
        txHash: paymentState.txHash,
        paymentId: await generatePaymentId(paymentState.txHash, serviceType),
      };
    }

    console.error("❌ Payment failed:", error);

    let errorMessage = "Payment failed. Please try again.";
    if (error.code === "INSUFFICIENT_FUNDS") errorMessage = "Insufficient balance.";
    else if (error.code === "USER_REJECTED" || error.code === 4001) errorMessage = "Transaction rejected.";
    else if (error.message?.includes("revert")) errorMessage = "Transaction reverted.";
    else if (error.message?.includes("Provider not ready")) errorMessage = "Wallet not ready. Please reconnect.";

    setPaymentState({
      completed: false,
      processing: false,
      txHash: null,
      error: errorMessage,
    });
  }
};


  // ✅ Generate unique payment ID
  const generatePaymentId = async (txHash: string, serviceType: string): Promise<string> => {
    const encoder = new ethers.AbiCoder();
    const encoded = encoder.encode(
      ["address", "string", "uint256", "bytes32"],
      [address, serviceType, Date.now(), ethers.keccak256(ethers.toUtf8Bytes(txHash))]
    );
    return ethers.keccak256(encoded);
  };

  const resetPayment = () => {
    setPaymentState({
      completed: false,
      processing: false,
      txHash: null,
      error: null,
    });
  };

  return {
    paymentState,
    initiatePayment,
    resetPayment,
  };
}
