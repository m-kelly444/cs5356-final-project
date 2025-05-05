'use client';

import React from 'react';
import { cn } from '@/lib/utils/theme';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary' | 'cyber' | 'cyberPink';
  text?: string;
  textPosition?: 'top' | 'bottom' | 'right' | 'left' | 'none';
  className?: string;
}

const Loader = ({
  size = 'md',
  variant = 'cyber',
  text,
  textPosition = 'bottom',
  className,
}: LoaderProps) => {
  // Size mapping
  const sizeMap = {
    sm: {
      container: 'h-4 w-4',
      border: 'border-2',
    },
    md: {
      container: 'h-8 w-8',
      border: 'border-2',
    },
    lg: {
      container: 'h-12 w-12',
      border: 'border-3',
    },
  };
  
  // Variant mapping
  const variantMap = {
    default: {
      border: 'border-gray-300',
      borderTop: 'border-t-gray-800',
      shadow: '',
    },
    primary: {
      border: 'border-blue-300',
      borderTop: 'border-t-blue-600',
      shadow: '',
    },
    secondary: {
      border: 'border-purple-300',
      borderTop: 'border-t-purple-600',
      shadow: '',
    },
    cyber: {
      border: 'border-cyan-500/30',
      borderTop: 'border-t-cyan-500',
      shadow: 'shadow-neon-blue',
    },
    cyberPink: {
      border: 'border-fuchsia-500/30',
      borderTop: 'border-t-fuchsia-500',
      shadow: 'shadow-neon-pink',
    },
  };
  
  // Choose styles based on props
  const sizeStyle = sizeMap[size];
  const variantStyle = variantMap[variant];
  
  // Container classes based on text position
  const containerClasses = {
    none: 'flex items-center justify-center',
    top: 'flex flex-col-reverse items-center gap-2',
    bottom: 'flex flex-col items-center gap-2',
    right: 'flex flex-row items-center gap-2',
    left: 'flex flex-row-reverse items-center gap-2',
  };
  
  return (
    <div className={cn(containerClasses[textPosition], className)}>
      <div
        className={cn(
          'relative rounded-full animate-spin',
          sizeStyle.container,
          sizeStyle.border,
          variantStyle.border,
          variantStyle.shadow
        )}
      >
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            sizeStyle.border,
            variantStyle.borderTop
          )}
          style={{
            clip: 'rect(0, 1em, 0.5em, 0)',
          }}
        />
      </div>
      
      {text && textPosition !== 'none' && (
        <span className={cn(
          'text-sm',
          variant === 'cyber' && 'text-cyan-400',
          variant === 'cyberPink' && 'text-fuchsia-400',
        )}>
          {text}
        </span>
      )}
    </div>
  );
};

// Cyberpunk themed loader with circuitry animation
const CyberLoader = ({ text, className }: { text?: string; className?: string }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="cyber-loader">
        {/* Inner circles */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30" />
          <div className="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin" style={{ animationDuration: '1s' }} />
          
          <div className="absolute inset-[3px] rounded-full border-2 border-fuchsia-500/30" />
          <div className="absolute inset-[3px] rounded-full border-t-2 border-fuchsia-500 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          
          <div className="absolute inset-[6px] rounded-full border-2 border-cyan-500/30" />
          <div className="absolute inset-[6px] rounded-full border-t-2 border-cyan-500 animate-spin" style={{ animationDuration: '2s' }} />
          
          {/* Center pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      
      {text && (
        <div className="mt-4 text-sm text-cyan-400 font-mono">
          {text.split('').map((char, i) => (
            <span
              key={i}
              className="inline-block"
              style={{
                animation: 'blink 1s infinite',
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {char}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Fullscreen loader overlay
const FullscreenLoader = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <CyberLoader text={message} />
      </div>
    </div>
  );
};

export { Loader, CyberLoader, FullscreenLoader };
export default Loader;