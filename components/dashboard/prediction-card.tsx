'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =================== PREDICTION CARD COMPONENT ===================

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
  
  // Ensure prediction object exists to prevent runtime errors
  if (!prediction) {
    return (
      <div className="cyber-card border-gray-500 shadow-lg p-4">
        <p className="text-red-400">Error: Prediction data not available</p>
      </div>
    );
  }
  
  // Format dates for display
  const formatDate = (date: number | string) => {
    if (!date) return 'Unknown date';
    
    try {
      const dateObj = typeof date === 'number' ? new Date(date) : new Date(date);
      return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  // Format the target type and value
  const formatTarget = () => {
    if (!prediction.targetType || !prediction.targetValue) {
      return 'Unknown target';
    }
    
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
    // Ensure severity exists and is a number
    const severityLevel = prediction.severity !== undefined && !isNaN(Number(prediction.severity)) 
      ? Number(prediction.severity) 
      : 0;
    
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
  
  // Ensure numeric values exist and are valid
  const displayProbability = prediction.probability !== undefined && !isNaN(Number(prediction.probability)) 
    ? Math.round(Number(prediction.probability) * 100) + '%' 
    : 'N/A';
    
  const displaySeverity = prediction.severity !== undefined && !isNaN(Number(prediction.severity)) 
    ? Number(prediction.severity).toFixed(1) 
    : 'N/A';
    
  const displayConfidence = prediction.confidence !== undefined && !isNaN(Number(prediction.confidence)) 
    ? Math.round(Number(prediction.confidence) * 100) + '%' 
    : 'N/A';
  
  return (
    <motion.div 
      className={`cyber-card overflow-hidden border relative ${severityInfo.borderClass} shadow-lg ${severityInfo.glowClass}`}
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
            <div className="text-lg font-bold">{displayProbability}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Severity</div>
            <div className="text-lg font-bold">{displaySeverity}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Confidence</div>
            <div className="text-lg font-bold">{displayConfidence}</div>
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
                {prediction.explanation || 'No explanation available'}
              </p>
              
              {/* Add a visual indicator for confidence */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Confidence Level</span>
                  <span>{displayConfidence}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${severityInfo.colorClass}`} 
                    style={{ width: `${(prediction.confidence || 0) * 100}%` }}
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

// =================== MOCK DATA ===================

// Mock data that matches the prediction interface
const mockPredictions = [
  {
    id: "pred-001",
    targetType: "organization",
    targetValue: "FinTech Corp",
    attackType: "ransomware",
    probability: 0.78,
    severity: 8.5,
    confidence: 0.82,
    generatedDate: Date.now() - 86400000, // Yesterday
    explanation: "Based on recent attack patterns, similar organizations in the financial sector have been targeted by sophisticated ransomware operations. The system has identified potential vulnerabilities in this organization's security posture."
  },
  {
    id: "pred-002",
    targetType: "sector",
    targetValue: "Healthcare",
    attackType: "dataBreach",
    probability: 0.65,
    severity: 7.2,
    confidence: 0.75,
    generatedDate: Date.now() - 172800000, // Two days ago
    explanation: "Healthcare organizations have seen an increase in data breach attempts targeting patient records. This prediction is based on observed threat actor behaviors and industry-specific vulnerability trends."
  },
  {
    id: "pred-003",
    targetType: "region",
    targetValue: "East Asia",
    attackType: "ddos",
    probability: 0.59,
    severity: 6.8,
    confidence: 0.68,
    generatedDate: Date.now() - 259200000, // Three days ago
    explanation: "Organizations in East Asia are facing elevated risks of distributed denial-of-service attacks. This prediction is based on increased botnet activity observed in regional networks."
  }
];

// =================== DASHBOARD COMPONENT ===================

// Component to display predictions using mock data
const PredictionDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Threat Intelligence Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">AI-Generated Threat Predictions</h2>
        <p className="text-gray-400 mb-4">
          The following predictions are generated based on machine learning analysis of current threat intelligence, attack patterns, and vulnerability data.
        </p>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockPredictions.map((prediction) => (
            <PredictionCard 
              key={prediction.id}
              prediction={prediction} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PredictionDashboard;