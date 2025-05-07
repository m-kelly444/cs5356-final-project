import { useState, useEffect } from 'react';'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle, Bug, Zap, Brain, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ThreatCardProps {
  threat: {
    id: string;
    title: string;
    type: 'attack' | 'vulnerability' | 'prediction' | 'indicator';
    severity: number;
    description: string;
    date: number | string;
    source?: string;
    tags?: string[];
    details?: any;
  };
}

export default function ThreatCard({ threat }: ThreatCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Format date for display
  const formatDate = (date: number | string) => {
    const dateObj = typeof date === 'number' ? new Date(date) : new Date(date);
    return formatDistanceToNow(dateObj, { addSuffix: true });
  };
  
  // Get icon based on threat type
  const getIcon = () => {
    switch (threat.type) {
      case 'attack':
        return <Zap className="h-5 w-5 text-red-500" />;
      case 'vulnerability':
        return <Bug className="h-5 w-5 text-yellow-500" />;
      case 'prediction':
        return <Brain className="h-5 w-5 text-cyan-500" />;
      case 'indicator':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get severity label and color
  const getSeverityInfo = () => {
    if (threat.severity >= 8) {
      return {
        label: 'Critical',
        colorClass: 'bg-red-500',
        textClass: 'text-red-400',
        borderClass: 'border-red-500/50',
      };
    } else if (threat.severity >= 6) {
      return {
        label: 'High',
        colorClass: 'bg-orange-500',
        textClass: 'text-orange-400',
        borderClass: 'border-orange-500/50',
      };
    } else if (threat.severity >= 4) {
      return {
        label: 'Medium',
        colorClass: 'bg-yellow-500',
        textClass: 'text-yellow-400',
        borderClass: 'border-yellow-500/50',
      };
    } else if (threat.severity >= 2) {
      return {
        label: 'Low',
        colorClass: 'bg-blue-500',
        textClass: 'text-blue-400',
        borderClass: 'border-blue-500/50',
      };
    } else {
      return {
        label: 'Info',
        colorClass: 'bg-green-500',
        textClass: 'text-green-400',
        borderClass: 'border-green-500/50',
      };
    }
  };
  
  // Get threat type label
  const getTypeLabel = () => {
    switch (threat.type) {
      case 'attack':
        return 'Cyber Attack';
      case 'vulnerability':
        return 'Vulnerability';
      case 'prediction':
        return 'Prediction';
      case 'indicator':
        return 'Indicator';
      default:
        return 'Threat';
    }
  };
  
  const severityInfo = getSeverityInfo();
  
  return (
    <motion.div 
      className={`cyber-card overflow-hidden border ${severityInfo.borderClass}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            {getIcon()}
            <span className="ml-2 text-xs font-medium uppercase text-gray-400">
              {getTypeLabel()}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${severityInfo.colorClass}`}>
              {severityInfo.label}
            </span>
          </div>
        </div>
        
        <h3 className="text-lg font-bold mb-2">{threat.title}</h3>
        
        <p className="text-sm text-gray-300 mb-3 line-clamp-2">
          {threat.description}
        </p>
        
        <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
          <span>{formatDate(threat.date)}</span>
          {threat.source && <span>Source: {threat.source}</span>}
        </div>
        
        {threat.tags && threat.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {threat.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-cyan-400 flex items-center hover:text-cyan-300 transition-colors"
          >
            {expanded ? 'Show Less' : 'Details'}
            <ChevronDown
              className={`ml-1 h-4 w-4 transition-transform ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </button>
          
          <Link
            href={`/dashboard/threats/${threat.id}`}
            className="text-xs text-cyan-400 flex items-center hover:text-cyan-300 transition-colors"
          >
            Full Analysis
            <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 pb-4 border-t border-gray-700 pt-3"
          >
            {threat.details ? (
              <div className="space-y-3">
                {/* Render different details based on threat type */}
                {threat.type === 'vulnerability' && (
                  <>
                    {threat.details.cveId && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-1">CVE ID</h4>
                        <p className="text-sm font-mono">{threat.details.cveId}</p>
                      </div>
                    )}
                    {threat.details.cvssScore && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-1">CVSS Score</h4>
                        <p className="text-sm">{threat.details.cvssScore.toFixed(1)}/10</p>
                      </div>
                    )}
                    {threat.details.affectedSystems && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-1">Affected Systems</h4>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {typeof threat.details.affectedSystems === 'string'
                            ? <li>{threat.details.affectedSystems}</li>
                            : threat.details.affectedSystems.map((system: string, i: number) => (
                                <li key={i}>{system}</li>
                              ))
                          }
                        </ul>
                      </div>
                    )}
                  </>
                )}
                
                {threat.type === 'attack' && (
                  <>
                    {threat.details.attackType && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-1">Attack Type</h4>
                        <p className="text-sm">{threat.details.attackType}</p>
                      </div>
                    )}
                    {threat.details.targetedSector && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-1">Targeted Sector</h4>
                        <p className="text-sm">{threat.details.targetedSector}</p>
                      </div>
                    )}
                    {threat.details.threatActor && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-1">Threat Actor</h4>
                        <p className="text-sm">{threat.details.threatActor}</p>
                      </div>
                    )}
                  </>
                )}
                
                {threat.type === 'prediction' && (
                  <>
                    {threat.details.probability && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-1">Probability</h4>
                        <p className="text-sm">{(threat.details.probability * 100).toFixed(1)}%</p>
                      </div>
                    )}
                    {threat.details.confidence && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-1">Confidence</h4>
                        <p className="text-sm">{(threat.details.confidence * 100).toFixed(1)}%</p>
                      </div>
                    )}
                    {threat.details.timeframe && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-1">Timeframe</h4>
                        <p className="text-sm">{threat.details.timeframe}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No additional details available.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Animated glow effect around the card based on severity */}
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
}