'use client';
import { useState, useEffect } from 'react';'use client';

// PredictionCard component
// Displays machine learning-based predictions for cyber threats

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PredictionCardProps {
  prediction: {
    id: string;
    targetType: string;
    targetValue: string;
    attackType?: string;
    probability: number;
    severity: number;
    confidence: number;
    generatedDate: number | string;
    explanation: string;
  };
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Format dates for display
  const formatDate = (date: number | string) => {
    const dateObj = typeof date === 'number' ? new Date(date) : new Date(date);
    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Format the target type and value
  const formatTarget = () => {
    switch (prediction.targetType) {
      case 'sector':
        return `${prediction.targetValue} Sector`;
      case 'region':
        return `${prediction.targetValue} Region`;
      case 'organization':
        return prediction.targetValue;
      default:
        return `${prediction.targetValue} (${prediction.targetType})`;
    }
  };
  
  // Format the attack type
  const formatAttackType = (type?: string) => {
    if (!type) return 'Unknown Attack';
    
    const typeMap: Record<string, string> = {
      'ransomware': 'Ransomware',
      'dataBreach': 'Data Breach',
      'ddos': 'DDoS Attack',
      'zeroDay': 'Zero-Day Exploit',
      'phishing': 'Phishing Campaign',
      'supplyChain': 'Supply Chain Attack',
      'insiderThreat': 'Insider Threat',
    };
    
    return typeMap[type] || type;
  };
  
  // Get severity class and label
  const getSeverityInfo = () => {
    const severityLevel = prediction.severity;
    
    if (severityLevel >= 8) {
      return {
        label: 'Critical',
        colorClass: 'bg-red-500',
        textClass: 'text-red-300',
        borderClass: 'border-red-500',
        glowClass: 'shadow-red-500/50',
      };
    } else if (severityLevel >= 6) {
      return {
        label: 'High',
        colorClass: 'bg-orange-500',
        textClass: 'text-orange-300',
        borderClass: 'border-orange-500',
        glowClass: 'shadow-orange-500/50',
      };
    } else if (severityLevel >= 4) {
      return {
        label: 'Medium',
        colorClass: 'bg-yellow-500',
        textClass: 'text-yellow-300',
        borderClass: 'border-yellow-500',
        glowClass: 'shadow-yellow-500/50',
      };
    } else if (severityLevel >= 2) {
      return {
        label: 'Low',
        colorClass: 'bg-blue-500',
        textClass: 'text-blue-300',
        borderClass: 'border-blue-500',
        glowClass: 'shadow-blue-500/50',
      };
    } else {
      return {
        label: 'Info',
        colorClass: 'bg-green-500',
        textClass: 'text-green-300',
        borderClass: 'border-green-500',
        glowClass: 'shadow-green-500/50',
      };
    }
  };
  
  const severityInfo = getSeverityInfo();
  
  return (
    <motion.div 
      className={`cyber-card overflow-hidden ${severityInfo.borderClass} shadow-lg ${severityInfo.glowClass}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className={`text-lg font-bold ${severityInfo.textClass}`}>
              {formatAttackType(prediction.attackType)}
            </h3>
            <p className="text-gray-400 text-sm">{formatTarget()}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className={`${severityInfo.colorClass} text-white text-xs font-bold px-2 py-1 rounded-full`}>
              {severityInfo.label}
            </span>
            <span className="text-gray-400 text-xs mt-1">
              {formatDate(prediction.generatedDate)}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 my-3">
          <div className="text-center">
            <div className="text-xs text-gray-400">Probability</div>
            <div className="text-lg font-bold">{Math.round(prediction.probability * 100)}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Severity</div>
            <div className="text-lg font-bold">{prediction.severity.toFixed(1)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Confidence</div>
            <div className="text-lg font-bold">{Math.round(prediction.confidence * 100)}%</div>
          </div>
        </div>
        
        <div className="mt-2">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs text-cyan-400 flex items-center justify-center hover:text-cyan-300 transition-colors"
          >
            {expanded ? 'Show Less' : 'Details'} 
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 border-t border-gray-700"
            >
              <p className="text-sm text-gray-300 mb-3">
                {prediction.explanation}
              </p>
              
              {/* Add a visual indicator for confidence */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Confidence Level</span>
                  <span>{Math.round(prediction.confidence * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${severityInfo.colorClass}`} 
                    style={{ width: `${prediction.confidence * 100}%` }}
                  />
                </div>
              </div>
              
              {/* View More button */}
              <div className="text-center mt-4">
                <a 
                  href={`/dashboard/predictions/${prediction.id}`}
                  className="inline-block px-4 py-1 text-xs border border-cyan-500 text-cyan-400 rounded hover:bg-cyan-900/30 transition-colors"
                >
                  Full Analysis
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Animated glow effect around the card */}
      <div 
        className={`absolute inset-0 -z-10 opacity-20 blur-md ${severityInfo.colorClass}`} 
        style={{ 
          animation: 'pulse 3s infinite alternate',
          transformOrigin: 'center',
        }}
      />
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 0.1;
            transform: scale(0.98);
          }
          100% {
            opacity: 0.25;
            transform: scale(1);
          }
        }
      `}</style>
    </motion.div>
  );
};

export default PredictionCard;