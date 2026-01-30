import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  // Determine appropriate inputMode and keyboard type for mobile
  const getInputMode = (inputType: string) => {
    switch (inputType) {
      case 'email':
        return 'email'
      case 'tel':
        return 'tel'
      case 'number':
        return 'numeric'
      case 'url':
        return 'url'
      case 'search':
        return 'search'
      default:
        return 'text'
    }
  }

  return (
    <input
      type={type}
      inputMode={getInputMode(type || 'text')}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-11 w-full min-w-0 rounded-lg border bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted min-h-[44px]",
        "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:focus:ring-destructive/30 dark:aria-invalid:ring-destructive/40",
        "hover:border-primary/50 hover:shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
