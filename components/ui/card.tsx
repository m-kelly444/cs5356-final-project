'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/theme';
import { cva, VariantProps } from 'class-variance-authority';

// Card variants
const cardVariants = cva(
  "rounded-lg shadow",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
        outline: "border border-border bg-background",
        
        // Cyberpunk variants
        cyber: "cyber-card",
        cyberOutline: "bg-gray-900/70 backdrop-blur-md border border-cyan-500/30 shadow-md hover:shadow-cyan-500/20 transition-all duration-300",
        cyberGlass: "glass-effect",
        cyberDark: "bg-gray-900/90 backdrop-blur-md border border-gray-800 shadow-md",
      },
      hover: {
        none: "",
        glow: "hover:shadow-neon-blue transition-all duration-300",
        scale: "hover:scale-102 transition-all duration-300",
        border: "hover:border-cyan-500/50 transition-all duration-300",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        glow: "animate-glow",
      }
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
      animation: "none",
    }
  }
);

// Card component props
export interface CardProps extends 
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> {}

// Card component
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, animation, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, animation }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

// Card Header component props
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

// Card Header component
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// Card Title component props
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

// Card Title component
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

// Card Description component props
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

// Card Description component
const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

// Card Content component props
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

// Card Content component
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

// Card Footer component props
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

// Card Footer component
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };