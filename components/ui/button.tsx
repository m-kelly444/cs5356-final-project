'use client';

import React from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/theme';

// Button variants using class-variance-authority
const buttonVariants = cva(
  // Base styles applied to all buttons
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      // Variant styles
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Cyberpunk variants
        cyber: "border border-cyber-blue-500 bg-transparent text-cyber-blue-400 hover:bg-cyber-blue-900/20 hover:text-cyber-blue-300 hover:shadow-neon-blue transition-all duration-300",
        cyberPrimary: "bg-gradient-to-r from-cyber-blue-600 to-cyber-blue-700 text-white hover:from-cyber-blue-500 hover:to-cyber-blue-600 shadow-md hover:shadow-neon-blue transition-all duration-300",
        cyberSecondary: "bg-gradient-to-r from-cyber-pink-600 to-cyber-pink-700 text-white hover:from-cyber-pink-500 hover:to-cyber-pink-600 shadow-md hover:shadow-neon-pink transition-all duration-300",
        cyberGhost: "bg-transparent text-cyan-400 hover:bg-cyan-900/20 hover:text-cyan-300 transition-all duration-300",
      },
      // Size styles
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      // Animation styles
      animation: {
        none: "",
        pulse: "animate-pulse",
        glow: "animate-glow",
      },
    },
    // Default variants
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
);

// Button props extend button element props and variant props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// Button component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, animation, asChild = false, ...props }, ref) => {
    // If asChild is true, the button will render its children directly
    const Comp = "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };