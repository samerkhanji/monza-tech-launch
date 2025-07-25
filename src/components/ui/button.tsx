
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-monza-yellow text-monza-black hover:bg-monza-yellow/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-monza-yellow/10 hover:text-monza-black hover:border-monza-yellow",
        secondary:
          "bg-monza-grey text-white hover:bg-monza-grey/80",
        ghost: "hover:bg-monza-yellow/10 hover:text-monza-black",
        link: "text-monza-grey underline-offset-4 hover:underline",
        success: "bg-green-500 text-white hover:bg-green-600",
      },
      size: {
        default: "h-10 px-4 py-2 md:h-10 md:px-4 md:py-2",
        sm: "h-9 px-3 text-xs md:h-9 md:px-3 md:text-sm",
        lg: "h-12 px-6 text-base md:h-11 md:px-8 md:text-sm",
        icon: "h-10 w-10 md:h-10 md:w-10",
        "mobile-friendly": "h-12 px-6 py-3 text-base min-w-[120px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
