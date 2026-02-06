'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { burnTokensSchema, type BurnTokensFormData } from '@/lib/validations'
import { Loader2, CheckCircle, ExternalLink, AlertTriangle, Flame, Eye, ArrowLeft, Shield, RefreshCw } from '@/lib/icons'
import { AuthWrapper } from '@/components/auth-wrapper'
import { BlockExplorerModal } from '@/components/block-explorer-modal'
import Link from 'next/link'

interface Token {
  id: string
  name: string
  currency: string
  contractAddress: string
  totalSupply: number
}

interface BurnResult {
  transactionHash: string
  status: string
  blockNumber?: number
}

interface BalanceInfo {
  available: string
  token: string
}

interface BurnStatus {
  step: 'idle' | 'validating' | 'burning' | 'confirming' | 'completed' | 'error'
  message: string
  progress: number
}

function BurnTokensContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [burnResult, setBurnResult] = useState<BurnResult | null>(null)
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const [userPartyId, setUserPartyId] = useState<string>('')
  const [burnStatus, setBurnStatus] = useState<BurnStatus>({
    step: 'idle',
    message: '',
    progress: 0
  })
  const [showBlockExplorer, setShowBlockExplorer] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    setValue,
    reset,
    watch
  } = useForm<BurnTokensFormData>({
    resolver: zodResolver(burnTokensSchema),
    mode: 'onChange'
  })

  const partyId = watch('partyId')
  const tokenId = watch('tokenId')
  const amount = watch('amount')

  // Get user party ID from localStorage
  useEffect(() => {
    const storedPartyId = localStorage.getItem('userPartyId')
    if (storedPartyId) {
      setUserPartyId(storedPartyId)
      setValue('partyId', storedPartyId)
    }
  }, [setValue])

  // Fetch available tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('/api/tokens')
        if (response.ok) {
          const data = await response.json()
          setTokens(data.tokens)
        }
      } catch (error) {
        console.error('Error fetching tokens:', error)
      }
    }

    fetchTokens()
  }, [])

  // Check balance when token or party ID changes
  useEffect(() => {
    const checkBalance = async () => {
      if (!tokenId || !partyId) {
        setBalanceInfo(null)
        return
      }

      setIsCheckingBalance(true)
      try {
        const response = await fetch(`/api/holdings?partyId=${encodeURIComponent(partyId)}&tokenId=${encodeURIComponent(tokenId)}`)
        const data = await response.json()
        
        if (data.success) {
          setBalanceInfo(data.balance)
        } else {
          setBalanceInfo({ available: '0', token: 'Unknown' })
        }
      } catch (error) {
        console.error('Error checking balance:', error)
        setBalanceInfo({ available: '0', token: 'Unknown' })
      } finally {
        setIsCheckingBalance(false)
      }
    }

    checkBalance()
  }, [tokenId, partyId])

  const refreshBalance = async () => {
    if (!tokenId || !partyId) return

    setIsCheckingBalance(true)
    try {
      const response = await fetch(`/api/holdings?partyId=${encodeURIComponent(partyId)}&tokenId=${encodeURIComponent(tokenId)}`)
      const data = await response.json()
      
      if (data.success) {
        setBalanceInfo(data.balance)
        toast.success('Balance refreshed')
      }
    } catch (error) {
      console.error('Error refreshing balance:', error)
      toast.error('Failed to refresh balance')
    } finally {
      setIsCheckingBalance(false)
    }
  }

  const onSubmit = async (data: BurnTokensFormData) => {
    // Validate balance before proceeding
    if (balanceInfo) {
      const requestedAmount = parseFloat(data.amount)
      const availableBalance = parseFloat(balanceInfo.available)
      
      if (requestedAmount > availableBalance) {
        toast.error(`Insufficient balance. Available: ${availableBalance}, Requested: ${requestedAmount}`)
        return
      }
    }

    setIsLoading(true)
    setBurnResult(null)
    
    try {
      // Step 1: Validating
      setBurnStatus({
        step: 'validating',
        message: 'Validating balance and burn parameters...',
        progress: 20
      })
      
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Step 2: Burning
      setBurnStatus({
        step: 'burning',
        message: 'Submitting burn transaction to Canton Network...',
        progress: 50
      })
      
      const response = await fetch('/api/burn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to burn tokens')
      }

      // Step 3: Confirming
      setBurnStatus({
        step: 'confirming',
        message: 'Confirming transaction on the network...',
        progress: 80
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Step 4: Completed
      setBurnStatus({
        step: 'completed',
        message: 'Tokens burned successfully!',
        progress: 100
      })
      
      setBurnResult(responseData.transaction)
      toast.success('Tokens burned successfully!')
      reset({
        partyId: userPartyId,
        tokenId: '',
        amount: '',
      })
      setBalanceInfo(null)
      
    } catch (error) {
      setBurnStatus({
        step: 'error',
        message: error instanceof Error ? error.message : 'Failed to burn tokens',
        progress: 0
      })
      toast.error(error instanceof Error ? error.message : 'Failed to burn tokens. Please try again.')
      console.error('Burn error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedToken = tokens.find(t => t.id === tokenId)
  const burnAmount = parseFloat(amount || '0')
  const availableBalance = parseFloat(balanceInfo?.available || '0')
  const isInsufficientBalance = burnAmount > availableBalance && burnAmount > 0

  return (
    <div className="page-container">
      {/* Professional Page Header */}
      <div className="page-header">
        <h1 className="page-title">Burn Fund Tokens</h1>
        <p className="page-description">
          Permanently destroy tokens from circulation. This action is <strong>irreversible</strong> and will reduce the total supply.
        </p>
      </div>

      {/* Enhanced Form Card */}
      <div className="enhanced-form-card animate-fade-in-up">
        <div className="card-header">
          <h2 className="card-title">Burn Configuration</h2>
          <p className="card-description">
            Select a token and specify the amount to permanently remove from circulation
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Party Information Section */}
            <div className="form-section">
              <h3 className="form-section-title">Party Information</h3>
              <div className="form-group">
                <label htmlFor="partyId" className="form-label required">Party ID</label>
                <div className="relative">
                  <input
                    id="partyId"
                    placeholder="Enter your Party ID"
                    {...register('partyId')}
                    disabled={isLoading || !!userPartyId}
                    className={`form-input ${
                      touchedFields.partyId 
                        ? errors.partyId 
                          ? 'border-error focus:border-error' 
                          : partyId && partyId.length > 0
                            ? 'border-success focus:border-success'
                            : 'border-input-border'
                        : 'border-input-border'
                    }`}
                  />
                  {touchedFields.partyId && partyId && !errors.partyId && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                  )}
                </div>
                {errors.partyId && (
                  <div className="form-error">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.partyId.message}
                  </div>
                )}
                {userPartyId && (
                  <div className="text-xs text-success mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Using stored Party ID
                  </div>
                )}
                <p className="form-help">The Party ID that owns the tokens to burn</p>
              </div>
            </div>

            {/* Token Selection & Amount Section */}
            <div className="form-section">
              <h3 className="form-section-title">Token Selection & Amount</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="tokenId" className="form-label required">Token to Burn</label>
                  <select 
                    id="tokenId"
                    {...register('tokenId')}
                    disabled={isLoading}
                    className="form-select"
                  >
                    <option value="">Select a token to burn</option>
                    {tokens.map((token) => (
                      <option key={token.id} value={token.id}>
                        {token.name} ({token.currency})
                      </option>
                    ))}
                  </select>
                  {errors.tokenId && (
                    <div className="form-error">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.tokenId.message}
                    </div>
                  )}
                  <p className="form-help">Choose the token to permanently destroy</p>
                </div>

                <div className="form-group">
                  <label htmlFor="amount" className="form-label required">Amount to Burn</label>
                  <input
                    id="amount"
                    type="number"
                    step="0.000001"
                    placeholder="0.000000"
                    {...register('amount')}
                    disabled={isLoading}
                    className={`form-input ${
                      isInsufficientBalance ? 'border-error focus:border-error' : ''
                    }`}
                  />
                  {errors.amount && (
                    <div className="form-error">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.amount.message}
                    </div>
                  )}
                  {isInsufficientBalance && (
                    <div className="form-error">
                      <AlertTriangle className="h-3 w-3" />
                      Insufficient balance. Available: {availableBalance}
                    </div>
                  )}
                  <p className="form-help">Number of tokens to permanently destroy</p>
                </div>
              </div>
            </div>

            {/* Balance Display */}
            {tokenId && (
              <div className="form-section" style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="form-section-title">Current Balance</h3>
                  <button
                    type="button"
                    onClick={refreshBalance}
                    disabled={isCheckingBalance}
                    className="btn btn-sm btn-outline"
                  >
                    <RefreshCw className={`h-4 w-4 ${isCheckingBalance ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                {isCheckingBalance ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <span className="text-muted-foreground">Checking balance...</span>
                  </div>
                ) : balanceInfo ? (
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-foreground">
                      {parseFloat(balanceInfo.available).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {balanceInfo.token} available for burning
                    </div>
                    {burnAmount > 0 && (
                      <div className="pt-4 border-t border-accent-border">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">After burn:</span>
                          <span className="font-semibold">
                            {Math.max(0, availableBalance - burnAmount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-4">Select a token to view balance</p>
                )}
              </div>
            )}

            {/* Warning for no tokens */}
            {tokens.length === 0 && (
              <div className="alert alert-warning">
                <AlertTriangle className="alert-icon" />
                <div>
                  <strong>No tokens available</strong>
                  <p>Please create a token contract first before burning tokens.</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`btn btn-primary btn-lg w-full ${isLoading ? 'btn-loading' : ''} ${!isValid || isInsufficientBalance ? 'opacity-60' : ''}`}
              disabled={isLoading || tokens.length === 0 || !isValid || isInsufficientBalance || !balanceInfo}
              style={{ 
                background: 'linear-gradient(135deg, #dc2626, #ea580c)',
                borderColor: '#dc2626'
              }}
            >
              {isLoading ? (
                'Burning Tokens...'
              ) : (
                <>
                  <Flame className="h-5 w-5" />
                  Burn {amount || '0'} {selectedToken?.currency || 'Tokens'}
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
              Burning in Progress
            </h3>
            <p className="card-description">
              Please wait while we process your burn transaction
            </p>
          </div>
          <div className="card-content space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${burnStatus.progress}%`,
                  background: 'linear-gradient(135deg, #dc2626, #ea580c)'
                }}
              />
            </div>
            
            {/* Status Message */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                burnStatus.step === 'error' ? 'bg-error' : 'animate-pulse'
              }`} style={{ 
                backgroundColor: burnStatus.step === 'error' ? 'var(--error)' : '#dc2626'
              }} />
              <span className="text-sm font-medium">{burnStatus.message}</span>
            </div>
            
            {/* Status Steps */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className={`text-center p-2 rounded ${
                burnStatus.progress >= 20 ? 'text-white' : 'bg-muted text-muted-foreground'
              }`} style={{
                background: burnStatus.progress >= 20 ? 'linear-gradient(135deg, #dc2626, #ea580c)' : undefined
              }}>
                Validating
              </div>
              <div className={`text-center p-2 rounded ${
                burnStatus.progress >= 50 ? 'text-white' : 'bg-muted text-muted-foreground'
              }`} style={{
                background: burnStatus.progress >= 50 ? 'linear-gradient(135deg, #dc2626, #ea580c)' : undefined
              }}>
                Burning
              </div>
              <div className={`text-center p-2 rounded ${
                burnStatus.progress >= 80 ? 'text-white' : 'bg-muted text-muted-foreground'
              }`} style={{
                background: burnStatus.progress >= 80 ? 'linear-gradient(135deg, #dc2626, #ea580c)' : undefined
              }}>
                Confirming
              </div>
              <div className={`text-center p-2 rounded ${
                burnStatus.progress >= 100 ? 'text-white' : 'bg-muted text-muted-foreground'
              }`} style={{
                background: burnStatus.progress >= 100 ? 'linear-gradient(135deg, #dc2626, #ea580c)' : undefined
              }}>
                Completed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {burnStatus.step === 'error' && !isLoading && (
        <div className="card animate-slide-in-right mt-8" style={{ background: 'var(--error-light)', borderColor: 'var(--error-border)' }}>
          <div className="card-header" style={{ background: 'var(--error)', color: 'white' }}>
            <h3 className="card-title flex items-center text-white">
              <AlertTriangle className="mr-3 h-6 w-6" />
              Burning Failed
            </h3>
            <p className="card-description text-white/90">
              There was an issue processing your burn transaction
            </p>
          </div>
          <div className="card-content space-y-4">
            <div className="p-4 bg-white border border-error-border rounded-lg">
              <p className="text-error font-medium">{burnStatus.message}</p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setBurnStatus({ step: 'idle', message: '', progress: 0 })
                }}
                className="btn btn-primary flex-1"
              >
                Try Again
              </button>
              <Link href="/holdings" className="flex-1">
                <button className="btn btn-secondary w-full">
                  Check Holdings
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Success Result Card */}
      {burnResult && (
        <div className="card animate-slide-in-right mt-8" style={{ background: 'var(--success-light)', borderColor: 'var(--success-border)' }}>
          <div className="card-header" style={{ background: 'var(--success)', color: 'white' }}>
            <h3 className="card-title flex items-center text-white">
              <CheckCircle className="mr-3 h-6 w-6" />
              Tokens Burned Successfully!
            </h3>
            <p className="card-description text-white/90">
              Your tokens have been permanently removed from circulation
            </p>
          </div>
          <div className="card-content space-y-6">
            <div>
              <label className="form-label text-success">Transaction Hash:</label>
              <div className="flex items-center space-x-3 p-4 bg-white border border-success-border rounded-lg mt-2">
                <code className="text-sm font-mono text-success flex-1 break-all">
                  {burnResult.transactionHash}
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
                <p className="text-lg font-semibold text-success capitalize mt-1">{burnResult.status}</p>
              </div>
              {burnResult.blockNumber && (
                <div className="p-4 bg-white border border-success-border rounded-lg">
                  <label className="form-label text-success">Block Number:</label>
                  <p className="text-lg font-semibold text-success mt-1">{burnResult.blockNumber}</p>
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

      {/* Warning Information Section */}
      <div className="card mt-8 animate-fade-in-up" style={{ 
        animationDelay: '0.2s',
        background: 'var(--warning-light)', 
        borderColor: 'var(--warning-border)' 
      }}>
        <div className="card-header" style={{ background: 'var(--warning)', color: 'white' }}>
          <h3 className="card-title text-white">⚠️ Important Warning</h3>
          <p className="card-description text-white/90">Critical information about token burning</p>
        </div>
        <div className="card-content">
          <div className="grid-responsive cols-2">
            <div>
              <h4 className="font-semibold mb-4 text-warning">Burn Process Details</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <strong>Irreversible:</strong> Burned tokens cannot be recovered
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <strong>Supply Impact:</strong> Total supply will be permanently reduced
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <strong>Network Fees:</strong> Transaction fees apply to burn operations
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <strong>Confirmation:</strong> Process typically takes 10-15 seconds
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-warning">Security Features</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Real-time balance validation before burning
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
        transactionHash={burnResult?.transactionHash || ''}
      />
    </div>
  )
}

export default function BurnTokensPage() {
  return (
    <AuthWrapper>
      <BurnTokensContent />
    </AuthWrapper>
  )
}