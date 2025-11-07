"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, TrendingUp, Gift, Smartphone } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">RewardHub</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => router.push("/rewards")}>
              My Rewards
            </Button>
            <Button variant="ghost" onClick={() => router.push("/admin/login")}>
              Analytics
            </Button>
            <Button onClick={() => router.push("/admin/login")} variant="outline">
              Admin
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Customer Feedback Rewards</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Scan QR codes, share your feedback, and instantly receive rewards. A simple way to engage your customers and
            gather valuable insights.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              onClick={() => router.push("/admin/login")}
            >
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/analytics")}>
              Learn More
            </Button>
          </div>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">1. Scan QR Code</h3>
            <p className="text-sm text-gray-600">
              Find the QR code on your product package and scan it with your phone
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">2. Share Feedback</h3>
            <p className="text-sm text-gray-600">
              Fill out a quick feedback form about your experience with the product
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">3. Get Reward</h3>
            <p className="text-sm text-gray-600">Instantly receive your reward directly to your phone or account</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">4. Track Impact</h3>
            <p className="text-sm text-gray-600">View analytics and insights from customer feedback in real-time</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-blue-600" />
                </div>
                Easy to Use
              </CardTitle>
              <CardDescription>Simple QR code scanning and quick feedback forms</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Customers can complete the entire process in under 2 minutes from scan to reward.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center">
                  <Gift className="w-4 h-4 text-indigo-600" />
                </div>
                Real-time Rewards
              </CardTitle>
              <CardDescription>Instant reward processing and delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Customers receive their rewards immediately upon feedback submission, enhancing satisfaction.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                Deep Analytics
              </CardTitle>
              <CardDescription>Comprehensive insights into customer sentiment</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Track conversion rates, average ratings, reward distribution, and customer feedback patterns.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="pt-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Engage Your Customers?</h2>
            <p className="mb-6 text-blue-100 max-w-xl mx-auto">
              Start generating QR codes and rewards today. See how customer feedback can transform your business.
            </p>
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => router.push("/admin/login")}
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="mt-20 bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2025 RewardHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
