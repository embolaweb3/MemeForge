"use client"

import { ReactNode } from 'react'
import {
  RainbowKitProvider,
  darkTheme,
  connectorsForWallets
} from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from 'wagmi'
import { mainnet, polygon, optimism, arbitrum, base,zeroGGalileoTestnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const queryClient = new QueryClient();

const og_testnet = {
  id: Number(process.env.NEXT_PUBLIC_OG_TESTNET_CHAIN_ID),
  name: 'OG-Testnet-Galileo',
  network: 'og-chain',
  nativeCurrency: {
    decimals: 18,
    name: 'OG',
    symbol: 'OG',
  },
  rpcUrls: {
    public: { http: [process.env.NEXT_PUBLIC_OG_TESTNET_RPC_URL!] },
    default: { http: [process.env.NEXT_PUBLIC_OG_TESTNET_RPC_URL!] },
  },
} as const;

const og_mainnet = {
  id: Number(process.env.NEXT_PUBLIC_OG_MAINNET_CHAIN_ID),
  name: '0g mainnet',
  network: 'og-chain',
  nativeCurrency: {
    decimals: 18,
    name: 'OG',
    symbol: 'OG',
  },
  rpcUrls: {
    public: { http: [process.env.NEXT_PUBLIC_OG_MAINNET_RPC_URL!] },
    default: { http: [process.env.NEXT_PUBLIC_OG_MAINNET_RPC_URL!] },
  },
} as const;

// Configure Wagmi config
const wagmiConfig = createConfig({
  chains: [og_testnet, og_mainnet] as const,
  transports: {
    [og_testnet.id]: http(),
    [og_mainnet.id]: http(),
  },
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
    })
  ]
})

// Custom theme
const customTheme = darkTheme({
  accentColor: '#06b6d4', // cyan-500
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={customTheme}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}