"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/app/components/ui/Button"
import { 
  Sparkles, 
  Home, 
  Zap, 
  TrendingUp, 
  User,
  Menu,
  X,
  Wallet
} from "lucide-react"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { isConnected } = useAccount()

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/generate", icon: Zap, label: "Generate" },
    { href: "/feed", icon: TrendingUp, label: "Trending" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 glassmorphism-intense border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">MemeForge</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
            
            {/* RainbowKit Connect Button */}
            <div className="ml-4">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted,
                }) => {
                  const ready = mounted && authenticationStatus !== 'loading'
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus || authenticationStatus === 'authenticated')

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <Button 
                              onClick={openConnectModal} 
                              variant="premium"
                              className="flex items-center space-x-2"
                            >
                              <Wallet className="h-4 w-4" />
                              <span>Connect Wallet</span>
                            </Button>
                          )
                        }

                        if (chain.unsupported) {
                          return (
                            <Button 
                              onClick={openChainModal} 
                              variant="destructive"
                            >
                              Wrong network
                            </Button>
                          )
                        }

                        return (
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={openChainModal}
                              variant="outline"
                              className="flex items-center space-x-2"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 12,
                                    height: 12,
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                    marginRight: 4,
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      style={{ width: 12, height: 12 }}
                                    />
                                  )}
                                </div>
                              )}
                              {chain.name}
                            </Button>

                            <Button
                              onClick={openAccountModal}
                              variant="glass"
                              className="flex items-center space-x-2"
                            >
                              <Wallet className="h-4 w-4" />
                              {account.displayName}
                              {account.displayBalance
                                ? ` (${account.displayBalance})`
                                : ''}
                            </Button>
                          </div>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden glassmorphism-intense rounded-lg mt-2 p-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              {/* Mobile Connect Button */}
              <div className="pt-2 border-t border-white/10">
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    authenticationStatus,
                    mounted,
                  }) => {
                    const ready = mounted && authenticationStatus !== 'loading'
                    const connected =
                      ready &&
                      account &&
                      chain &&
                      (!authenticationStatus || authenticationStatus === 'authenticated')

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <Button 
                                onClick={openConnectModal} 
                                variant="premium"
                                className="w-full justify-center"
                              >
                                <Wallet className="h-4 w-4 mr-2" />
                                Connect Wallet
                              </Button>
                            )
                          }

                          if (chain.unsupported) {
                            return (
                              <Button 
                                onClick={openChainModal} 
                                variant="destructive"
                                className="w-full"
                              >
                                Wrong network
                              </Button>
                            )
                          }

                          return (
                            <div className="space-y-2">
                              <Button
                                onClick={openChainModal}
                                variant="outline"
                                className="w-full justify-start"
                              >
                                {chain.hasIcon && (
                                  <div
                                    style={{
                                      background: chain.iconBackground,
                                      width: 12,
                                      height: 12,
                                      borderRadius: 999,
                                      overflow: 'hidden',
                                      marginRight: 8,
                                    }}
                                  >
                                    {chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? 'Chain icon'}
                                        src={chain.iconUrl}
                                        style={{ width: 12, height: 12 }}
                                      />
                                    )}
                                  </div>
                                )}
                                {chain.name}
                              </Button>

                              <Button
                                onClick={openAccountModal}
                                variant="glass"
                                className="w-full justify-start"
                              >
                                <Wallet className="h-4 w-4 mr-2" />
                                {account.displayName}
                              </Button>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}