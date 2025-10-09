"use client"

import { Button } from "@/app/components/ui/Button"
import { Card, CardContent } from "@/app/components/ui/Card"
import { 
  Sparkles, 
  Zap, 
  Shield, 
  TrendingUp, 
  Repeat,
  ArrowRight,
  Star
} from "lucide-react"
import Link from "next/link"

export default function Home() {
  const features = [
    {
      icon: Zap,
      title: "AI Meme Generation",
      description: "Generate hilarious memes instantly using OG Inference AI"
    },
    {
      icon: Shield,
      title: "Permanent Storage",
      description: "Store memes permanently on OG Storage with verifiable hashes"
    },
    {
      icon: TrendingUp,
      title: "Trending Feed",
      description: "Discover and share the most popular memes in the community"
    },
    {
      icon: Repeat,
      title: "Remix Mode",
      description: "Remix existing memes with new captions and styles"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 glassmorphism rounded-full px-4 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium">Powered by OG Inference & Storage</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text text-glow">Meme</span>
            <span className="text-white">Forge</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Create, remix, and store AI-powered memes permanently on-chain. 
            Your creativity, immortalized.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/generate">
              <Button size="lg" variant="premium" className="text-lg px-8 py-6">
                <Zap className="h-5 w-5 mr-2" />
                Create Your First Meme
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/feed">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <TrendingUp className="h-5 w-5 mr-2" />
                Explore Trending
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: "10K+", label: "Memes Generated" },
              { value: "5K+", label: "Active Creators" },
              { value: "1M+", label: "Total Reactions" },
              { value: "100%", label: "On-Chain Storage" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why <span className="gradient-text">MemeForge?</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              The most advanced meme creation platform powered by cutting-edge blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glassmorphism-card border-white/5 hover:border-cyan-500/30 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center glassmorphism-intense rounded-3xl p-8 md:p-12">
          <Star className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Ready to Create Magic?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of creators building the future of memes on-chain
          </p>
          <Link href="/generate">
            <Button size="lg" variant="premium" className="text-lg px-8 py-6">
              <Sparkles className="h-5 w-5 mr-2" />
              Start Creating Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}