'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { transferTokensSchema, type TransferTokensFormData } from '@/lib/validations'
import { Loader2, CheckCircle, ExternalLink, AlertTriangle } from '@/lib/icons'
import { AuthWrapper } from '@/components/auth-wrapper'
import { BlockExplorerModal } from '@/components/block-explorer-modal'

interface Token {
  id: string
  name: string
  currency: string
  contractAddress: string
}

interface TransferResult {
  transactionHash: string
  status: string
  blockNumber?: number
}

interface BalanceInfo {
  available: string
  token: string
}

interface TransferStatus {
  step: 'idle' | 'validating' | 'transferring' | 'confirming' | 'completed' | 'error'
  message: string
  progress: number
}

function TransferTokensContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null)
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const [transferStatus, setTransferStatus] = useState<TransferStatus>({
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
    watch,
    reset
  } = useForm<TransferTokensFormData>({
    resolver: zodResolver(transferTokensSchema),
    mode: 'onChange' // Enable real-time validation
  })

  const senderPartyId = watch('senderPartyId')
  const selectedTokenId = watch('tokenId')

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

  // Check balance when sender and token are selected
  useEffect(() => {
    const checkBalance = async () => {
      if (senderPartyId && selectedTokenId) {
        setIsCheckingBalance(true)
        try {
          const response = await fetch(`/api/holdings?partyId=${senderPartyId}&tokenId=${selectedTokenId}`)
          if (response.ok) {
            const data = await response.json()
            setBalanceInfo(data.balance)
          } else {
            setBalanceInfo(null)
          }
        } catch (error) {
          console.error('Error checking balance:', error)
          setBalanceInfo(null)
        } finally {
          setIsCheckingBalance(false)
        }
      } else {
        setBalanceInfo(null)
      }
    }

    checkBalance()
  }, [senderPartyId, selectedTokenId])

  const onSubmit = async (data: TransferTokensFormData) => {
    setIsLoading(true)
    setTransferResult(null)
    
    try {
      // Step 1: Validating
      setTransferStatus({
        step: 'validating',
        message: 'Validating sender balance and recipient information...',
        progress: 20
      })
      
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Step 2: Transferring
      setTransferStatus({
        step: 'transferring',
        message: 'Submitting transfer transaction to Canton Network...',
        progress: 50
      })
      
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to transfer tokens')
      }

      // Step 3: Confirming
      setTransferStatus({
        step: 'confirming',
        message: 'Confirming transaction on the network...',
        progress: 80
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Step 4: Completed
      setTransferStatus({
        step: 'completed',
        message: 'Tokens transferred successfully!',
        progress: 100
      })
      
      setTransferResult(responseData.transaction)
      toast.success('Tokens transferred successfully!')
      reset()
      setBalanceInfo(null)
      
    } catch (error) {
      setTransferStatus({
        step: 'error',
        message: error instanceof Error ? error.message : 'Failed to transfer tokens',
        progress: 0
      })
      toast.error(error instanceof Error ? error.message : 'Failed to transfer tokens. Please try again.')
      console.error('Transfer error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container">
      {/* Enhanced Header */}
      <div className="page-header">
        <h1 className="page-title">Transfer Tokens</h1>
        <p className="page-description">
          Securely transfer tokens between Party IDs on the Canton Network with real-time balance verification
        </p>
      </div>

      {/* Enhanced Form Card */}
      <div className="enhanced-form-card animate-fade-in-up">
        <div className="card-header">
          <h2 className="card-title">Transfer Configuration</h2>
          <p className="card-description">
            Specify sender, recipient, token, and amount for secure peer-to-peer transfers
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="senderPartyId" className="form-label">Sender Party ID</label>
                <input
                  id="senderPartyId"
                  placeholder="Enter sender's Party ID"
                  {...register('senderPartyId')}
                  disabled={isLoading}
                  className="form-input"
                />
                {errors.senderPartyId && (
                  <p className="text-sm text-error mt-1">{errors.senderPartyId.message}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="recipientPartyId" className="form-label">Recipient Party ID</label>
                <input
                  id="recipientPartyId"
                  placeholder="Enter recipient's Party ID"
                  {...register('recipientPartyId')}
                  disabled={isLoading}
                  className="form-input"
                />
                {errors.recipientPartyId && (
                  <p className="text-sm text-error mt-1">{errors.recipientPartyId.message}</p>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="tokenId" className="form-label">Token</label>
                <select 
                  id="tokenId"
                  {...register('tokenId')}
                  disabled={isLoading}
                  className="form-select"
                >
                  <option value="">Select a token to transfer</option>
                  {tokens.map((token) => (
                    <option key={token.id} value={token.id}>
                      {token.name} ({token.currency})
                    </option>
                  ))}
                </select>
                {errors.tokenId && (
                  <p className="text-sm text-error mt-1">{errors.tokenId.message}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="amount" className="form-label">Transfer Amount</label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount to transfer"
                  {...register('amount')}
                  disabled={isLoading}
                  className="form-input"
                />
                {errors.amount && (
                  <p className="text-sm text-error mt-1">{errors.amount.message}</p>
                )}
              </div>
            </div>

            {/* Enhanced Balance Display */}
            {(senderPartyId && selectedTokenId) && (
              <div className="card" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                <div className="card-header">
                  <h4 className="card-title">Balance Verification</h4>
                </div>
                <div className="card-content">
                  {isCheckingBalance ? (
                    <div className="flex items-center text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking balance...
                    </div>
                  ) : balanceInfo ? (
                    <div className="flex items-center text-success">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span><strong>Available Balance:</strong> {balanceInfo.available} {balanceInfo.token}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-warning">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      <span>No balance found or insufficient funds</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tokens.length === 0 && (
              <div className="alert alert-warning">
                <AlertTriangle className="h-4 w-4" />
                <span>No tokens available. Please create a token contract first.</span>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-lg w-full" 
              disabled={isLoading || tokens.length === 0 || !balanceInfo}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Transfer...
                </>
              ) : (
                'Transfer Tokens'
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
              Transfer in Progress
            </h3>
            <p className="card-description">
              Please wait while we process your transfer transaction
            </p>
          </div>
          <div className="card-content space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${transferStatus.progress}%` }}
              />
            </div>
            
            {/* Status Message */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                transferStatus.step === 'error' ? 'bg-error' : 'bg-primary animate-pulse'
              }`} />
              <span className="text-sm font-medium">{transferStatus.message}</span>
            </div>
            
            {/* Status Steps */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className={`text-center p-2 rounded ${
                transferStatus.progress >= 20 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                Validating
              </div>
              <div className={`text-center p-2 rounded ${
                transferStatus.progress >= 50 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                Transferring
              </div>
              <div className={`text-center p-2 rounded ${
                transferStatus.progress >= 80 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                Confirming
              </div>
              <div className={`text-center p-2 rounded ${
                transferStatus.progress >= 100 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                Completed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {transferStatus.step === 'error' && !isLoading && (
        <div className="card animate-slide-in-right mt-8" style={{ background: 'var(--error-light)', borderColor: 'var(--error-border)' }}>
          <div className="card-header" style={{ background: 'var(--error)', color: 'white' }}>
            <h3 className="card-title flex items-center text-white">
              <AlertTriangle className="mr-3 h-6 w-6" />
              Transfer Failed
            </h3>
            <p className="card-description text-white/90">
              There was an issue processing your transfer transaction
            </p>
          </div>
          <div className="card-content space-y-4">
            <div className="p-4 bg-white border border-error-border rounded-lg">
              <p className="text-error font-medium">{transferStatus.message}</p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setTransferStatus({ step: 'idle', message: '', progress: 0 })
                }}
                className="btn btn-primary flex-1"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {transferResult && (
        <div className="card mt-6 animate-slide-in-right" style={{ background: 'var(--success)', color: 'white', border: '1px solid var(--success)' }}>
          <div className="card-header">
            <h3 className="card-title flex items-center text-white">
              <CheckCircle className="mr-2 h-5 w-5" />
              Transfer Completed Successfully!
            </h3>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="text-white font-medium">Transaction Hash:</label>
              <div className="flex items-center space-x-2 p-3 bg-white/10 border border-white/20 rounded-md mt-1">
                <code className="text-sm font-mono text-white flex-1">
                  {transferResult.transactionHash}
                </code>
                <button
                  onClick={() => {
                    setShowBlockExplorer(true)
                  }}
                  className="btn btn-sm bg-white/20 hover:bg-white/30 text-white border-white/20"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid-responsive cols-2">
              <div>
                <label className="text-white font-medium">Status:</label>
                <p className="text-white font-medium capitalize mt-1">{transferResult.status}</p>
              </div>
              {transferResult.blockNumber && (
                <div>
                  <label className="text-white font-medium">Block Number:</label>
                  <p className="text-white font-medium mt-1">{transferResult.blockNumber}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Info Section */}
      <div className="card mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="card-header">
          <h3 className="card-title">Transfer Information</h3>
        </div>
        <div className="card-content">
          <div className="grid-responsive cols-2">
            <div>
              <h4 className="font-semibold mb-3">Process Details</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Transfers require sufficient balance in sender's account</li>
                <li>• All transfers are atomic and recorded on Canton Network</li>
                <li>• Balance verification happens in real-time</li>
                <li>• Transaction confirmation typically takes 10-15 seconds</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Security Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time balance verification before transfer</li>
                <li>• Atomic transaction processing ensures consistency</li>
                <li>• Immutable transaction records on Canton Network</li>
                <li>• Enterprise-grade security protocols</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Block Explorer Modal */}
      <BlockExplorerModal
        isOpen={showBlockExplorer}
        onClose={() => setShowBlockExplorer(false)}
        transactionHash={transferResult?.transactionHash || ''}
      />
    </div>
  )
}

export default function TransferTokensPage() {
  return (
    <AuthWrapper>
      <TransferTokensContent />
    </AuthWrapper>
  )
}