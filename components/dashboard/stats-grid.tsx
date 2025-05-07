"use client";import { useState, useEffect } from 'react';'use client';

// StatsGrid component
// Displays key cybersecurity statistics in a grid layout with trend indicators

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface StatsGridProps {
  kevStats: {
    totalVulnerabilities: number;
    addedLast30Days: number;
    addedLast90Days: number;
    remediationDueSoon: number;
    byVendor?: Record<string, number>;
  };
  vulnerabilityCount: {
    total: number;
    critical: number;
  };
  attackStats: {
    recentCount: number;
    predictedCount: number;
  };
}

const StatsGrid: React.FC<StatsGridProps> = ({ 
  kevStats, 
  vulnerabilityCount,
  attackStats
}) => {
  // Animate counter effect
  const counterRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  
  // Animate number counting up
  useEffect(() => {
    const animateValue = (
      element: HTMLSpanElement, 
      start: number, 
      end: number, 
      duration: number
    ) => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value.toString();
        if (progress < 1) {
          typeof window !== 'undefined' ? window.requestAnimationFrame(step);
        }
      };
      typeof window !== 'undefined' ? window.requestAnimationFrame(step);
    };
    
    // Animate each counter
    Object.entries(counterRefs.current).forEach(([key, element]) => {
      if (element) {
        let value = 0;
        
        // Set the target value based on the key
        switch (key) {
          case 'kev-total':
            value = kevStats.totalVulnerabilities;
            break;
          case 'kev-30days':
            value = kevStats.addedLast30Days;
            break;
          case 'kev-90days':
            value = kevStats.addedLast90Days;
            break;
          case 'kev-due':
            value = kevStats.remediationDueSoon;
            break;
          case 'vuln-total':
            value = vulnerabilityCount.total;
            break;
          case 'vuln-critical':
            value = vulnerabilityCount.critical;
            break;
          case 'attacks-recent':
            value = attackStats.recentCount;
            break;
          case 'attacks-predicted':
            value = attackStats.predictedCount;
            break;
        }
        
        animateValue(element, 0, value, 1000);
      }
    });
  }, [kevStats, vulnerabilityCount, attackStats]);
  
  // Helper function to determine trend indicator
  const getTrendIndicator = (isPositive: boolean, isNeutral: boolean = false) => {
    if (isNeutral) {
      return (
        <span className="text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        </span>
      );
    }
    
    return isPositive ? (
      <span className="text-green-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </span>
    ) : (
      <span className="text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </span>
    );
  };
  
  // Stats cards configuration
  const statsCards = [
    {
      title: 'CISA KEV Total',
      value: kevStats.totalVulnerabilities,
      trend: getTrendIndicator(false),
      description: 'Total vulnerabilities in CISA KEV catalog',
      refKey: 'kev-total',
      color: 'from-blue-500/20 to-blue-600/20',
      textColor: 'text-blue-400',
    },
    {
      title: 'Added Last 30 Days',
      value: kevStats.addedLast30Days,
      trend: getTrendIndicator(kevStats.addedLast30Days > 10),
      description: 'New vulnerabilities added in the last month',
      refKey: 'kev-30days',
      color: 'from-purple-500/20 to-purple-600/20',
      textColor: 'text-purple-400',
    },
    {
      title: 'Added Last 90 Days',
      value: kevStats.addedLast90Days,
      trend: getTrendIndicator(kevStats.addedLast90Days > 30),
      description: 'New vulnerabilities added in the last quarter',
      refKey: 'kev-90days',
      color: 'from-indigo-500/20 to-indigo-600/20',
      textColor: 'text-indigo-400',
    },
    {
      title: 'Remediation Due Soon',
      value: kevStats.remediationDueSoon,
      trend: getTrendIndicator(kevStats.remediationDueSoon > 5, kevStats.remediationDueSoon === 0),
      description: 'Vulnerabilities with remediation due in 14 days',
      refKey: 'kev-due',
      color: 'from-red-500/20 to-red-600/20',
      textColor: 'text-red-400',
    },
    {
      title: 'Recent Vulnerabilities',
      value: vulnerabilityCount.total,
      trend: getTrendIndicator(vulnerabilityCount.total > 20),
      description: 'Vulnerabilities published in the last 30 days',
      refKey: 'vuln-total',
      color: 'from-orange-500/20 to-orange-600/20',
      textColor: 'text-orange-400',
    },
    {
      title: 'Critical Vulnerabilities',
      value: vulnerabilityCount.critical,
      trend: getTrendIndicator(vulnerabilityCount.critical > 5),
      description: 'Critical severity vulnerabilities (CVSS 9.0+)',
      refKey: 'vuln-critical',
      color: 'from-yellow-500/20 to-yellow-600/20',
      textColor: 'text-yellow-400',
    },
    {
      title: 'Recent Attacks',
      value: attackStats.recentCount,
      trend: getTrendIndicator(attackStats.recentCount > 5),
      description: 'Cyber attacks recorded in the last 30 days',
      refKey: 'attacks-recent',
      color: 'from-cyan-500/20 to-cyan-600/20',
      textColor: 'text-cyan-400',
    },
    {
      title: 'Predicted Attacks',
      value: attackStats.predictedCount,
      trend: getTrendIndicator(attackStats.predictedCount > attackStats.recentCount),
      description: 'Predicted attacks in the next 30 days',
      refKey: 'attacks-predicted',
      color: 'from-emerald-500/20 to-emerald-600/20',
      textColor: 'text-emerald-400',
    },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((card, index) => (
        <motion.div
          key={card.refKey}
          className={`cyber-card p-4 bg-gradient-to-br ${card.color} backdrop-blur-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-bold text-gray-400">{card.title}</h3>
            <div className="flex items-center">
              {card.trend}
            </div>
          </div>
          
          <div className="mt-2 flex items-baseline">
            <span 
              ref={el => counterRefs.current[card.refKey] = el} 
              className={`text-2xl font-extrabold ${card.textColor}`}
            >
              0
            </span>
          </div>
          
          <p className="mt-1 text-xs text-gray-400">
            {card.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsGrid;