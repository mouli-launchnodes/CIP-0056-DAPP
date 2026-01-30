'use client'

import { useState } from 'react'
import { X, ExternalLink, Copy, CheckCircle, Clock, AlertTriangle, Coins, ArrowRightLeft, Flame } from '@/lib/icons'
import { toast } from 'sonner'

interface Transaction {
  id: string
  type: 'MINT' | 'TRANSFER' | 'BURN'
  amount: string
  fromPartyId?: string
  toPartyId?: string
  transactionHash?: string
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    partyId: string
  }
  token: {
    id: string
    name: string
    currency: string
    contractAddress: string
  }
}

interface BlockExplorerModalProps {
  isOpen: boolean
  onClose: () => void
  transactionHash: string
  transaction?: Transaction
}

export function BlockExplorerModal({ isOpen, onClose, transactionHash, transaction }: BlockExplorerModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'MINT': return <Coins className="h-5 w-5 text-green-600" />
      case 'TRANSFER': return <ArrowRightLeft className="h-5 w-5 text-blue-600" />
      case 'BURN': return <Flame className="h-5 w-5 text-red-600" />
      default: return <CheckCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'FAILED': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950/30'
      case 'PENDING': return 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950/30'
      case 'FAILED': return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/30'
      default: return 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-950/30'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatAmount = (amount: string, currency: string) => {
    const num = parseFloat(amount)
    return `${num.toLocaleString()} ${currency}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <ExternalLink className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Block Explorer</h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-outline p-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Hash */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="text-sm font-mono flex-1 break-all">{transactionHash}</code>
              <button
                onClick={() => copyToClipboard(transactionHash)}
                className="btn btn-sm btn-outline p-1"
                title="Copy hash"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Transaction Details */}
          {transaction && (
            <>
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Transaction Type</label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    {getTransactionIcon(transaction.type)}
                    <span className="font-medium">{transaction.type}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    {getStatusIcon(transaction.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Token</label>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">{transaction.token.name}</div>
                    <div className="text-sm text-muted-foreground">{transaction.token.currency}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="font-mono font-medium">
                      {formatAmount(transaction.amount, transaction.token.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Party Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Party Information</h3>
                
                {transaction.type === 'MINT' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Recipient</label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="text-sm font-mono flex-1 break-all">{transaction.toPartyId}</code>
                      <button
                        onClick={() => copyToClipboard(transaction.toPartyId!)}
                        className="btn btn-sm btn-outline p-1"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {transaction.type === 'TRANSFER' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">From</label>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <code className="text-sm font-mono flex-1 break-all">{transaction.fromPartyId}</code>
                        <button
                          onClick={() => copyToClipboard(transaction.fromPartyId!)}
                          className="btn btn-sm btn-outline p-1"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">To</label>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <code className="text-sm font-mono flex-1 break-all">{transaction.toPartyId}</code>
                        <button
                          onClick={() => copyToClipboard(transaction.toPartyId!)}
                          className="btn btn-sm btn-outline p-1"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {transaction.type === 'BURN' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Burned From</label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="text-sm font-mono flex-1 break-all">{transaction.user.partyId}</code>
                      <button
                        onClick={() => copyToClipboard(transaction.user.partyId)}
                        className="btn btn-sm btn-outline p-1"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-sm">{formatDate(transaction.createdAt)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-sm">{formatDate(transaction.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Contract Information */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Contract Address</label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="text-sm font-mono flex-1 break-all">{transaction.token.contractAddress}</code>
                  <button
                    onClick={() => copyToClipboard(transaction.token.contractAddress)}
                    className="btn btn-sm btn-outline p-1"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Canton Network Info */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-4">Network Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Network</label>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="font-medium">Canton Network</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Protocol</label>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="font-medium">DAML Smart Contracts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <ExternalLink className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Canton Network Explorer:</strong> This transaction is recorded on the Canton Network using DAML smart contracts. 
                All operations are atomic and immutable, ensuring enterprise-grade security and compliance.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-border">
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
          <button
            onClick={() => copyToClipboard(transactionHash)}
            className="btn btn-primary"
          >
            <Copy className="h-4 w-4" />
            Copy Hash
          </button>
        </div>
      </div>
    </div>
  )
}