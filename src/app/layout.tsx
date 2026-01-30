import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
})

export const metadata: Metadata = {
  title: 'Canton Network Tokenization Demo',
  description: 'A demo application for Canton Network tokenization using CIP0056 standard with Auth0 authentication',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={inter.className}>
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>
        <ThemeProvider
          defaultTheme="light"
          storageKey="ui-theme"
        >
          <Auth0Provider>
            {children}
          </Auth0Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}