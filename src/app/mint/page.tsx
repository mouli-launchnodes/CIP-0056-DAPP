'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { mintTokensSchema, type MintTokensFormData } from '@/lib/validations'
import { Loader2, CheckCircle, ExternalLink, AlertTriangle, Coins, Eye, ArrowLeft, Shield, Plus } from '@/lib/icons'
import { AuthWrapper } from '@/components/auth-wrapper'
import { BlockExplorerModal } from '@/components/block-explorer-modal'
import Link from 'next/link'

interface Token {
  id: string
  name: string
  currency: string
  contractAddress: string
}

interface MintResult {
  transactionHash: string
  status: string
  blockNumber?: number
}

interface MintStatus {
  step: 'idle' | 'validating' | 'minting' | 'confirming' | 'completed' | 'error'
  message: string
  progress: number
}

function MintTokensContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const [mintStatus, setMintStatus] = useState<MintStatus>({
    step: 'idle',
    message: '',
    progress: 0
  })
  const [showBlockExplorer, setShowBlockExplorer] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    setValue,
    reset,
    watch
  } = useForm<MintTokensFormData>({
    resolver: zodResolver(mintTokensSchema),
    mode: 'onChange' // Enable real-time validation
  })

  const recipientPartyId = watch('recipientPartyId')
  const tokenId = watch('tokenId')
  const amount = watch('amount')

  // Fetch available tokens with refresh capability
  const fetchTokens = async (showLoading = false) => {
    if (showLoading) setIsLoadingTokens(true)
    
    try {
      console.log('Fetching tokens for mint page...')
      const response = await fetch('/api/tokens', {
        // Add cache-busting to ensure fresh data
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log(`Found ${data.tokens?.length || 0} tokens for minting`)
          setTokens(data.tokens || [])
          setLastRefresh(new Date())
          
          if (data.tokens?.length > 0) {
            toast.success(`Loaded ${data.tokens.length} available tokens`)
          }
        } else {
          throw new Error(data.error || 'Failed to fetch tokens')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching tokens:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error loading tokens'
      
      // Check if it's a DAML unavailable error
      if (errorMessage.includes('DAML ledger is required')) {
        toast.error('DAML ledger is not available. Please ensure DAML is running.')
      } else {
        toast.error(errorMessage)
      }
      
      // Set empty tokens array on error
      setTokens([])
    } finally {
      if (showLoading) setIsLoadingTokens(false)
    }
  }

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchTokens(true)
    
    // Set up periodic refresh every 30 seconds to catch new tokens
    const interval = setInterval(() => {
      fetchTokens(false)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Listen for page visibility changes to refresh when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing tokens...')
        fetchTokens(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const onSubmit = async (data: MintTokensFormData) => {
    setIsLoading(true)
    setMintResult(null)
    
    try {
      // Step 1: Validating
      setMintStatus({
        step: 'validating',
        message: 'Validating token and recipient information...',
        progress: 20
      })
      
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Step 2: Minting
      setMintStatus({
        step: 'minting',
        message: 'Submitting mint transaction to Canton Network...',
        progress: 50
      })
      
      const response = await fetch('/api/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to mint tokens')
      }

      // Step 3: Confirming
      setMintStatus({
        step: 'confirming',
        message: 'Confirming transaction on the network...',
        progress: 80
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Step 4: Completed
      setMintStatus({
        step: 'completed',
        message: 'Tokens minted successfully!',
        progress: 100
      })
      
      setMintResult(responseData.transaction)
      toast.success('Tokens minted successfully!')
      
      // Refresh token list to show updated total supply
      setTimeout(() => {
        fetchTokens(false)
      }, 1000)
      
      reset()
      
    } catch (error) {
      setMintStatus({
        step: 'error',
        message: error instanceof Error ? error.message : 'Failed to mint tokens',
        progress: 0
      })
      toast.error(error instanceof Error ? error.message : 'Failed to mint tokens. Please try again.')
      console.error('Mint error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container">
      {/* Professional Page Header */}
      <div className="page-header">
        <h1 className="page-title">Mint Tokens</h1>
        <p className="page-description">
          Create new tokens and distribute them to Party IDs on the Canton Network with real-time validation and enterprise security
        </p>
      </div>

      {/* Enhanced Form Card */}
      <div className="enhanced-form-card animate-fade-in-up">
        <div className="card-header">
          <h2 className="card-title">Mint Configuration</h2>
          <p className="card-description">
            Select a token contract and specify the recipient and amount to mint new tokens
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Recipient Information Section */}
            <div className="form-section">
              <h3 className="form-section-title">Recipient Information</h3>
              <div className="form-group">
                <label htmlFor="recipientPartyId" className="form-label required">Recipient Party ID</label>
                <div className="relative">
                  <input
                    id="recipientPartyId"
                    placeholder="Enter the recipient's Party ID"
                    {...register('recipientPartyId')}
                    disabled={isLoading}
                    className={`form-input ${
                      touchedFields.recipientPartyId 
                        ? errors.recipientPartyId 
                          ? 'border-error focus:border-error' 
                          : recipientPartyId && recipientPartyId.length > 0
                            ? 'border-success focus:border-success'
                            : 'border-input-border'
                        : 'border-input-border'
                    }`}
                  />
                  {touchedFields.recipientPartyId && recipientPartyId && !errors.recipientPartyId && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                  )}
                </div>
                {errors.recipientPartyId && (
                  <div className="form-error">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.recipientPartyId.message}
                  </div>
                )}
                {touchedFields.recipientPartyId && !errors.recipientPartyId && recipientPartyId && (
                  <div className="text-xs text-success mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Valid Party ID format
                  </div>
                )}
                <p className="form-help">The Party ID that will receive the newly minted tokens</p>
              </div>
            </div>

            {/* Token Selection Section */}
            <div className="form-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="form-section-title">Token Selection & Amount</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchTokens(true)}
                    disabled={isLoadingTokens}
                    className="btn btn-sm btn-outline"
                    title="Refresh token list"
                  >
                    {isLoadingTokens ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Refresh'
                    )}
                  </button>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="tokenId" className="form-label required">Token/Instrument</label>
                  <select 
                    id="tokenId"
                    {...register('tokenId')}
                    disabled={isLoading || isLoadingTokens}
                    className="form-select"
                  >
                    <option value="">
                      {isLoadingTokens 
                        ? 'Loading tokens...' 
                        : tokens.length === 0 
                          ? 'No tokens available - create one first'
                          : 'Select a token to mint'
                      }
                    </option>
                    {tokens.map((token) => (
                      <option key={token.id} value={token.id}>
                        {token.name} ({token.currency}) - {token.contractAddress.substring(0, 8)}...
                      </option>
                    ))}
                  </select>
                  {errors.tokenId && (
                    <div className="form-error">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.tokenId.message}
                    </div>
                  )}
                  <p className="form-help">
                    Choose the token contract to mint from
                    {tokens.length > 0 && (
                      <span className="text-success"> • {tokens.length} tokens available</span>
                    )}
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="amount" className="form-label required">Token Amount</label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount to mint"
                    {...register('amount')}
                    disabled={isLoading}
                    className="form-input"
                  />
                  {errors.amount && (
                    <div className="form-error">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.amount.message}
                    </div>
                  )}
                  <p className="form-help">Number of tokens to create and distribute</p>
                </div>
              </div>
            </div>

            {/* Warning for no tokens */}
            {!isLoadingTokens && tokens.length === 0 && (
              <div className="alert alert-warning">
                <AlertTriangle className="alert-icon" />
                <div className="flex-1">
                  <strong>No tokens available for minting</strong>
                  <p>You need to create a token contract first before you can mint tokens.</p>
                </div>
                <Link href="/create-token">
                  <button className="btn btn-sm btn-primary">
                    <Plus className="h-4 w-4" />
                    Create Token
                  </button>
                </Link>
              </div>
            )}

            {/* Loading state for tokens */}
            {isLoadingTokens && (
              <div className="alert alert-info">
                <Loader2 className="alert-icon animate-spin" />
                <div>
                  <strong>Loading available tokens...</strong>
                  <p>Please wait while we fetch your token contracts.</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`btn btn-primary btn-lg w-full ${(isLoading || isLoadingTokens) ? 'btn-loading' : ''} ${!isValid ? 'opacity-60' : ''}`}
              disabled={isLoading || isLoadingTokens || tokens.length === 0 || !isValid}
            >
              {isLoading ? (
                'Minting Tokens...'
              ) : isLoadingTokens ? (
                'Loading Tokens...'
              ) : (
                <>
                  <Coins className="h-5 w-5" />
                  Mint Tokens
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Live Status Updates */}
      {isLoading && (
        <div className="card animate-slide-in-right mt-8">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Minting in Progress
            </h3>
            <p className="card-description">
              Please wait while we process your mint transaction
            </p>
          </div>
          <div className="card-content space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${mintStatus.progress}%` }}
              />
            </div>
            
            {/* Status Message */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                mintStatus.step === 'error' ? 'bg-error' : 'bg-primary animate-pulse'
              }`} />
              <span className="text-sm font-medium">{mintStatus.message}</span>
            </div>
            
            {/* Status Steps */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className={`text-center p-2 rounded ${
                mintStatus.progress >= 20 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                Validating
              </div>
              <div className={`text-center p-2 rounded ${
                mintStatus.progress >= 50 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                Minting
              </div>
              <div className={`text-center p-2 rounded ${
                mintStatus.progress >= 80 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                Confirming
              </div>
              <div className={`text-center p-2 rounded ${
                mintStatus.progress >= 100 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                Completed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {mintStatus.step === 'error' && !isLoading && (
        <div className="card animate-slide-in-right mt-8" style={{ background: 'var(--error-light)', borderColor: 'var(--error-border)' }}>
          <div className="card-header" style={{ background: 'var(--error)', color: 'white' }}>
            <h3 className="card-title flex items-center text-white">
              <AlertTriangle className="mr-3 h-6 w-6" />
              Minting Failed
            </h3>
            <p className="card-description text-white/90">
              There was an issue processing your mint transaction
            </p>
          </div>
          <div className="card-content space-y-4">
            <div className="p-4 bg-white border border-error-border rounded-lg">
              <p className="text-error font-medium">{mintStatus.message}</p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setMintStatus({ step: 'idle', message: '', progress: 0 })
                }}
                className="btn btn-primary flex-1"
              >
                Try Again
              </button>
              <Link href="/create-token" className="flex-1">
                <button className="btn btn-secondary w-full">
                  Create Token First
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Success Result Card */}
      {mintResult && (
        <div className="card animate-slide-in-right mt-8" style={{ background: 'var(--success-light)', borderColor: 'var(--success-border)' }}>
          <div className="card-header" style={{ background: 'var(--success)', color: 'white' }}>
            <h3 className="card-title flex items-center text-white">
              <CheckCircle className="mr-3 h-6 w-6" />
              Tokens Minted Successfully!
            </h3>
            <p className="card-description text-white/90">
              Your tokens have been created and distributed to the recipient
            </p>
          </div>
          <div className="card-content space-y-6">
            <div>
              <label className="form-label text-success">Transaction Hash:</label>
              <div className="flex items-center space-x-3 p-4 bg-white border border-success-border rounded-lg mt-2">
                <code className="text-sm font-mono text-success flex-1 break-all">
                  {mintResult.transactionHash}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockExplorer(true)
                  }}
                  className="btn btn-sm btn-outline border-success text-success hover:bg-success hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid-responsive cols-2">
              <div className="p-4 bg-white border border-success-border rounded-lg">
                <label className="form-label text-success">Status:</label>
                <p className="text-lg font-semibold text-success capitalize mt-1">{mintResult.status}</p>
              </div>
              {mintResult.blockNumber && (
                <div className="p-4 bg-white border border-success-border rounded-lg">
                  <label className="form-label text-success">Block Number:</label>
                  <p className="text-lg font-semibold text-success mt-1">{mintResult.blockNumber}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Link href="/holdings" className="flex-1">
                <button className="btn btn-accent w-full">
                  <Eye className="h-4 w-4" />
                  View Holdings
                </button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <button className="btn btn-secondary w-full">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Information Section */}
      <div className="card mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="card-header">
          <h3 className="card-title">Minting Information</h3>
          <p className="card-description">Important details about the token minting process</p>
        </div>
        <div className="card-content">
          <div className="grid-responsive cols-2">
            <div>
              <h4 className="font-semibold mb-4 text-accent">Process Details</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Tokens are minted directly to the recipient's Party ID
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  All transactions are recorded on the Canton Network
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Minting increases the total supply of the token
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Transaction confirmation typically takes 10-15 seconds
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-accent">Security Features</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Real-time validation of recipient Party IDs
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Atomic transaction processing
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Immutable transaction records
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Enterprise-grade security protocols
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Block Explorer Modal */}
      <BlockExplorerModal
        isOpen={showBlockExplorer}
        onClose={() => setShowBlockExplorer(false)}
        transactionHash={mintResult?.transactionHash || ''}
      />
    </div>
  )
}

export default function MintTokensPage() {
  return (
    <AuthWrapper>
      <MintTokensContent />
    </AuthWrapper>
  )
}