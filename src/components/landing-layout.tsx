'use client'

import { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'

interface LandingLayoutProps {
  children: ReactNode
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="page-container">
        {/* Landing Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-4">
            Canton Network Tokenization
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to the Canton Network tokenization platform. Get started by onboarding to generate your unique Party ID.
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}