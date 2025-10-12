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
    if (chainId !== 366) throw new Error("Please switch to 0G Chain to use MemeForge");
    if (!paymentHandler) throw new Error("Payment contract not available");

    setPaymentState({
      completed: false,
      processing: true,
      txHash: null,
      error: null,
    });

    try {
      // Get required fee for the service
      const requiredFee = await paymentHandler.getServiceFee(serviceType);
      console.log(`Paying ${ethers.formatEther(requiredFee)} ZGS for ${serviceType}`);

      // Execute the payment transaction
      const tx = await paymentHandler.payForService(serviceType, {
        value: requiredFee,
      });

      setPaymentState((prev) => ({ ...prev, txHash: tx.hash }));

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt.status === BigInt(1)) {
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
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Payment failed:", error);
      let errorMessage = "Payment failed. Please try again.";

      if (error.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient balance. Please add ZGS to your wallet.";
      } else if (error.code === "USER_REJECTED" || error.code === 4001) {
        errorMessage = "Transaction was rejected.";
      } else if (error.message?.includes("revert")) {
        errorMessage = "Transaction reverted. Please try again.";
      }

      setPaymentState({
        completed: false,
        processing: false,
        txHash: null,
        error: errorMessage,
      });

      throw new Error(errorMessage);
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
