import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:ring-2 focus-visible:ring-primary/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-95 hover:shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm focus-visible:outline-primary",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 shadow-sm focus-visible:outline-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 focus-visible:outline-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm focus-visible:outline-primary",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 focus-visible:outline-primary",
        link: "text-primary underline-offset-4 hover:underline focus-visible:outline-primary p-0 h-auto min-h-0",
      },
      size: {
        default: "h-11 px-4 py-2 has-[>svg]:px-3 min-h-[44px] text-sm",
        xs: "h-8 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3 min-h-[32px]",
        sm: "h-10 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 min-h-[40px] text-sm",
        lg: "h-12 rounded-lg px-6 has-[>svg]:px-4 min-h-[48px] text-base",
        icon: "size-11 min-w-[44px] min-h-[44px] p-0",
        "icon-xs": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3 min-w-[32px] min-h-[32px] p-0",
        "icon-sm": "size-10 min-w-[40px] min-h-[40px] p-0",
        "icon-lg": "size-12 min-w-[48px] min-h-[48px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
