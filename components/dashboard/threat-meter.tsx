'use client';

import React, { useState, useEffect } from 'react';

// ThreatMeter component - displays a gauge with current threat level
interface ThreatMeterProps {
  level: number; // 0-100 threat level
}

const ThreatMeter: React.FC<ThreatMeterProps> = ({ level }) => {
  // Clamp level between 0-100
  const threatLevel = Math.min(Math.max(level, 0), 100);
  
  // Calculate rotation for gauge needle (from -130 to 130 degrees)
  const rotation = -130 + (260 * (threatLevel / 100));
  
  // Determine color based on threat level
  const getColor = () => {
    if (threatLevel >= 80) return '#FF0000'; // Red
    if (threatLevel >= 60) return '#FF8800'; // Orange
    if (threatLevel >= 40) return '#FFFF00'; // Yellow
    if (threatLevel >= 20) return '#00FF00'; // Green
    return '#00FFAA'; // Teal
  };
  
  // Determine threat level text
  const getThreatText = () => {
    if (threatLevel >= 80) return 'CRITICAL';
    if (threatLevel >= 60) return 'HIGH';
    if (threatLevel >= 40) return 'ELEVATED';
    if (threatLevel >= 20) return 'GUARDED';
    return 'LOW';
  };
  
  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Gauge container */}
      <div className="relative aspect-[2/1] w-full">
        {/* Gauge background */}
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Gauge base */}
          <path
            d="M20,90 A80,80 0 0,1 180,90"
            fill="none"
            stroke="#1f2937"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Gauge colored sections */}
          {/* Low (0-20%) */}
          <path
            d="M20,90 A80,80 0 0,1 52,57"
            fill="none"
            stroke="#00FFAA"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Guarded (20-40%) */}
          <path
            d="M52,57 A80,80 0 0,1 78,36"
            fill="none"
            stroke="#00FF00"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Elevated (40-60%) */}
          <path
            d="M78,36 A80,80 0 0,1 122,36"
            fill="none"
            stroke="#FFFF00"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* High (60-80%) */}
          <path
            d="M122,36 A80,80 0 0,1 148,57"
            fill="none"
            stroke="#FF8800"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Critical (80-100%) */}
          <path
            d="M148,57 A80,80 0 0,1 180,90"
            fill="none"
            stroke="#FF0000"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Gauge marks */}
          <g className="text-gray-400 fill-current text-xs">
            {/* 0% mark */}
            <text x="15" y="100" textAnchor="middle">0</text>
            {/* 25% mark */}
            <text x="50" y="65" textAnchor="middle">25</text>
            {/* 50% mark */}
            <text x="100" y="30" textAnchor="middle">50</text>
            {/* 75% mark */}
            <text x="150" y="65" textAnchor="middle">75</text>
            {/* 100% mark */}
            <text x="185" y="100" textAnchor="middle">100</text>
          </g>
          
          {/* Gauge center point */}
          <circle cx="100" cy="90" r="6" fill="#1f2937" stroke="#374151" strokeWidth="2" />
          
          {/* Needle */}
          <g transform={`rotate(${rotation}, 100, 90)`}>
            <line
              x1="100"
              y1="90"
              x2="100"
              y2="20"
              stroke={getColor()}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="90" r="3" fill={getColor()} />
          </g>
        </svg>
        
        {/* Digital display */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <div 
            className="cyber-lcd px-4 py-1 rounded border-2 font-mono text-lg font-bold flex items-center justify-center gap-2"
            style={{ borderColor: getColor(), color: getColor() }}
          >
            <span>{threatLevel.toFixed(0)}</span>
            <span className="text-xs">{getThreatText()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock implementation with sample data
const ThreatMeterWithMockData: React.FC = () => {
  const [threatLevel, setThreatLevel] = useState(65); // Initial threat level
  
  // Simulate changing threat levels
  useEffect(() => {
    // Update threat level every 10 seconds with slight randomness
    const interval = setInterval(() => {
      // Generate a random value between -5 and +5
      const change = Math.floor(Math.random() * 11) - 5;
      
      // Apply the change but keep within 0-100 range
      setThreatLevel(prevLevel => {
        const newLevel = prevLevel + change;
        return Math.min(Math.max(newLevel, 0), 100); // Clamp between 0-100
      });
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="p-6 w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Current Threat Level</h2>
        <p className="text-gray-400 text-sm mb-4">
          Real-time assessment of global cyber threat levels based on attack frequency, severity, and intelligence reports.
        </p>
      </div>
      
      {/* Render the ThreatMeter with the current threat level */}
      <ThreatMeter level={threatLevel} />
      
      {/* Additional context about the threat level */}
      <div className="mt-6 p-4 border border-gray-700 rounded-md bg-gray-800/50">
        <h3 className="text-sm font-semibold mb-2">Threat Analysis</h3>
        <p className="text-sm text-gray-300">
          {threatLevel >= 80 ? (
            "Critical alert: Multiple high-severity attacks detected across critical infrastructure sectors. Immediate security response recommended."
          ) : threatLevel >= 60 ? (
            "High alert: Significant increase in attack activity. Enhanced monitoring and proactive defense measures advised."
          ) : threatLevel >= 40 ? (
            "Elevated alert: Above normal threat activity detected. Review security posture and prepare incident response plans."
          ) : threatLevel >= 20 ? (
            "Guarded alert: Normal threat activity with potential for targeted attacks. Maintain standard security protocols."
          ) : (
            "Low alert: Minimal threat activity detected. Routine security monitoring recommended."
          )}
        </p>
      </div>
    </div>
  );
};

export default ThreatMeterWithMockData;