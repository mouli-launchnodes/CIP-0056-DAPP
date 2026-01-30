'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { tokenCreationSchema, type TokenCreationFormData } from '@/lib/validations'
import { Loader2, CheckCircle, Copy, Plus, AlertTriangle, Coins, ArrowLeft } from '@/lib/icons'
import { AuthWrapper } from '@/components/auth-wrapper'
import Link from 'next/link'

interface DeployedContract {
  contractId: string
  contractAddress: string
  owner: string
  tokenName: string
  currency: string
}

function CreateTokenContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [deployedContract, setDeployedContract] = useState<DeployedContract | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<TokenCreationFormData>({
    resolver: zodResolver(tokenCreationSchema),
    defaultValues: {
      quantityPrecision: 2,
      pricePrecision: 2
    }
  })

  const currency = watch('currency')

  const onSubmit = async (data: TokenCreationFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to deploy token contract')
      }

      const result = await response.json()
      setDeployedContract(result.contract)
      toast.success('Token contract deployed successfully!')
      reset()
    } catch (error) {
      toast.error('Failed to deploy token contract. Please try again.')
      console.error('Token creation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="page-container">
      {/* Professional Page Header */}
      <div className="page-header">
        <h1 className="page-title">Create Token Contract</h1>
        <p className="page-description">
          Deploy a new CIP0056-compliant token contract on Canton Network with enterprise-grade security and compliance features
        </p>
      </div>

      {/* Enhanced Form Card */}
      <div className="enhanced-form-card animate-fade-in-up">
        <div className="card-header">
          <h2 className="card-title">Token Configuration</h2>
          <p className="card-description">
            Configure your token parameters and deploy the smart contract to the Canton Network
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information Section */}
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="tokenName" className="form-label required">Token Name</label>
                  <input
                    id="tokenName"
                    placeholder="e.g., MyToken"
                    {...register('tokenName')}
                    disabled={isLoading}
                    className="form-input"
                  />
                  {errors.tokenName && (
                    <div className="form-error">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.tokenName.message}
                    </div>
                  )}
                  <p className="form-help">Choose a unique name for your token contract</p>
                </div>

                <div className="form-group">
                  <label htmlFor="currency" className="form-label required">Currency</label>
                  <select 
                    id="currency"
                    {...register('currency')}
                    disabled={isLoading}
                    className="form-select"
                  >
                    <option value="">Select currency</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                  {errors.currency && (
                    <div className="form-error">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.currency.message}
                    </div>
                  )}
                  <p className="form-help">Base currency for token valuation</p>
                </div>
              </div>
            </div>

            {/* Precision Settings Section */}
            <div className="form-section">
              <h3 className="form-section-title">Precision Settings</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="quantityPrecision" className="form-label">Quantity Precision (Decimals)</label>
                  <input
                    id="quantityPrecision"
                    type="number"
                    min="0"
                    max="18"
                    {...register('quantityPrecision', { valueAsNumber: true })}
                    disabled={isLoading}
                    className="form-input"
                  />
                  {errors.quantityPrecision && (
                    <div className="form-error">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.quantityPrecision.message}
                    </div>
                  )}
                  <p className="form-help">Number of decimal places for token quantities (0-18)</p>
                </div>

                <div className="form-group">
                  <label htmlFor="pricePrecision" className="form-label">Price Precision (Decimals)</label>
                  <input
                    id="pricePrecision"
                    type="number"
                    min="0"
                    max="18"
                    {...register('pricePrecision', { valueAsNumber: true })}
                    disabled={isLoading}
                    className="form-input"
                  />
                  {errors.pricePrecision && (
                    <div className="form-error">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.pricePrecision.message}
                    </div>
                  )}
                  <p className="form-help">Number of decimal places for token pricing (0-18)</p>
                </div>
              </div>
            </div>

            {/* Contract Information Display */}
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Contract Information</h4>
              </div>
              <div className="card-content">
                <div className="grid-responsive cols-2">
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-muted-foreground">Contract Owner:</span>
                    <span className="font-semibold">System Generated</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-muted-foreground">Contract Address:</span>
                    <span className="font-semibold">Generated after deployment</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-muted-foreground">Standard:</span>
                    <span className="font-semibold">CIP0056 Token Standard</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-muted-foreground">Network:</span>
                    <span className="font-semibold">Canton Testnet</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`btn btn-primary btn-lg w-full ${isLoading ? 'btn-loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                'Deploying Contract...'
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Deploy Token Contract
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      {/* Success Result Card */}
      {deployedContract && (
        <div className="card animate-slide-in-right mt-8" style={{ background: 'var(--success-light)', borderColor: 'var(--success-border)' }}>
          <div className="card-header" style={{ background: 'var(--success)', color: 'white' }}>
            <h3 className="card-title flex items-center text-white">
              <CheckCircle className="mr-3 h-6 w-6" />
              Contract Deployed Successfully!
            </h3>
            <p className="card-description text-white/90">
              Your token contract has been deployed to the Canton Network
            </p>
          </div>
          <div className="card-content space-y-6">
            <div className="space-y-4">
              <div>
                <label className="form-label text-success">Contract ID:</label>
                <div className="flex items-center space-x-3 p-4 bg-white border border-success-border rounded-lg mt-2">
                  <code className="text-sm font-mono text-success flex-1 break-all">
                    {deployedContract.contractId}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(deployedContract.contractId)}
                    className="btn btn-sm btn-outline border-success text-success hover:bg-success hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label text-success">Contract Address:</label>
                <div className="flex items-center space-x-3 p-4 bg-white border border-success-border rounded-lg mt-2">
                  <code className="text-sm font-mono text-success flex-1 break-all">
                    {deployedContract.contractAddress}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(deployedContract.contractAddress)}
                    className="btn btn-sm btn-outline border-success text-success hover:bg-success hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid-responsive cols-2">
                <div className="p-4 bg-white border border-success-border rounded-lg">
                  <label className="form-label text-success">Token Name:</label>
                  <p className="text-lg font-semibold text-success mt-1">{deployedContract.tokenName}</p>
                </div>
                <div className="p-4 bg-white border border-success-border rounded-lg">
                  <label className="form-label text-success">Currency:</label>
                  <p className="text-lg font-semibold text-success mt-1">{deployedContract.currency}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="/mint" className="flex-1">
                <button className="btn btn-accent w-full">
                  <Coins className="h-4 w-4" />
                  Mint Tokens
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
    </div>
  )
}

export default function CreateTokenPage() {
  return (
    <AuthWrapper>
      <CreateTokenContent />
    </AuthWrapper>
  )
}