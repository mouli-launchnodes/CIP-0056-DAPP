'use client'

interface LoadingSkeletonProps {
  className?: string
  rows?: number
  variant?: 'text' | 'circular' | 'rectangular' | 'table'
}

export function LoadingSkeleton({ 
  className = '', 
  rows = 1, 
  variant = 'rectangular' 
}: LoadingSkeletonProps) {
  if (variant === 'table') {
    return (
      <div className="space-y-4 p-6">
        {[...Array(rows)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex items-center space-x-4 p-4 border-b border-border">
              <div className="w-2 h-2 bg-muted rounded-full loading-skeleton"></div>
              <div className="w-24 h-4 bg-muted rounded loading-skeleton"></div>
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-10 h-10 bg-muted rounded-xl loading-skeleton"></div>
                <div className="space-y-2">
                  <div className="w-20 h-4 bg-muted rounded loading-skeleton"></div>
                  <div className="w-12 h-3 bg-muted rounded loading-skeleton"></div>
                </div>
              </div>
              <div className="w-16 h-6 bg-muted rounded loading-skeleton"></div>
              <div className="w-16 h-6 bg-muted rounded loading-skeleton"></div>
              <div className="w-16 h-6 bg-muted rounded loading-skeleton"></div>
              <div className="w-12 h-6 bg-muted rounded-full loading-skeleton"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {[...Array(rows)].map((_, index) => (
          <div 
            key={index} 
            className={`h-4 bg-muted rounded loading-skeleton ${className}`}
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'circular') {
    return (
      <div className={`w-10 h-10 bg-muted rounded-full loading-skeleton ${className}`} />
    )
  }

  return (
    <div className={`bg-muted rounded loading-skeleton ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <LoadingSkeleton className="h-6 w-32" />
          <LoadingSkeleton variant="circular" />
        </div>
      </div>
      <div className="card-content space-y-4">
        <LoadingSkeleton variant="text" rows={3} />
        <div className="flex gap-4">
          <LoadingSkeleton className="h-10 flex-1" />
          <LoadingSkeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="stats-grid">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="stat-card animate-pulse">
          <div className="stat-header">
            <LoadingSkeleton className="h-4 w-20" />
            <LoadingSkeleton variant="circular" className="w-8 h-8" />
          </div>
          <LoadingSkeleton className="h-8 w-16 mt-4" />
          <LoadingSkeleton className="h-3 w-24 mt-2" />
        </div>
      ))}
    </div>
  )
}