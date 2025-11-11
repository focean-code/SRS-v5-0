import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Shopper Reward System",
  description: "Mobiwave SRS",
  generator: "Mobiwave Innovations",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${GeistSans.className} ${GeistMono.className}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
