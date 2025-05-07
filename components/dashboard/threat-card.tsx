'use client';

import React from 'react';
import ThreatCard from './threat-card'; // Using your original component

// Mock data for threats
const mockThreats = [
  {
    id: "threat-001",
    title: "APT Group Targeting Energy Sector",
    type: "attack",
    severity: 9.2,
    description: "A sophisticated APT group is targeting energy sector organizations with a new malware strain designed to compromise industrial control systems.",
    date: Date.now() - 3600000 * 48, // 2 days ago
    source: "Threat Intelligence Feed",
    tags: ["APT", "Energy Sector", "ICS", "Malware"],
    details: {
      attackType: "Spear Phishing + Custom Malware",
      targetedSector: "Energy / Utilities",
      threatActor: "BlackEnergy APT"
    }
  },
  {
    id: "threat-002",
    title: "Zero-day Vulnerability in Windows",
    type: "vulnerability",
    severity: 8.7,
    description: "A critical zero-day vulnerability has been discovered in Windows operating systems that could allow remote code execution with system privileges.",
    date: Date.now() - 3600000 * 24, // 1 day ago
    source: "Microsoft Security Response Center",
    tags: ["Zero-day", "Windows", "RCE"],
    details: {
      cveId: "CVE-2025-12345",
      cvssScore: 8.7,
      affectedSystems: [
        "Windows 11",
        "Windows 10",
        "Windows Server 2022",
        "Windows Server 2019"
      ]
    }
  },
  {
    id: "threat-003",
    title: "Ransomware Campaign Targeting Healthcare",
    type: "prediction",
    severity: 7.5,
    description: "Based on observed indicators and recent attack patterns, our AI system predicts a significant ransomware campaign targeting healthcare organizations within the next 14 days.",
    date: Date.now() - 3600000 * 12, // 12 hours ago
    source: "Predictive Threat Intelligence",
    tags: ["Ransomware", "Healthcare", "AI Prediction"],
    details: {
      probability: 0.82,
      confidence: 0.75,
      timeframe: "Next 14 days"
    }
  },
  {
    id: "threat-004",
    title: "Suspicious Network Scanning Activity",
    type: "indicator",
    severity: 5.4,
    description: "Multiple organizations are reporting increased scanning activity targeting TCP ports associated with database services from IP ranges linked to known threat actors.",
    date: Date.now() - 3600000 * 6, // 6 hours ago
    source: "Threat Intelligence Sharing Platform",
    tags: ["Network Scanning", "Database Services", "IOC"],
    details: {
      indicatorType: "Network Activity",
      relatedThreatActors: ["APT41", "Cobalt Strike"],
      recommendedActions: "Block suspicious IP ranges and monitor database services for unauthorized access attempts"
    }
  },
  {
    id: "threat-005",
    title: "New Supply Chain Attack Framework",
    type: "attack",
    severity: 8.3,
    description: "Security researchers have identified a new framework being used by threat actors to conduct supply chain attacks against software development pipelines.",
    date: Date.now() - 3600000 * 36, // 36 hours ago
    source: "Security Research Team",
    tags: ["Supply Chain", "Software Development", "CI/CD"],
    details: {
      attackType: "Supply Chain Compromise",
      targetedSector: "Software Development",
      threatActor: "UNC2452"
    }
  },
  {
    id: "threat-006",
    title: "Critical Vulnerability in Apache Struts",
    type: "vulnerability",
    severity: 9.1,
    description: "A critical vulnerability has been discovered in Apache Struts that allows remote code execution through maliciously crafted HTTP requests.",
    date: Date.now() - 3600000 * 72, // 3 days ago
    source: "Apache Security Team",
    tags: ["Apache", "RCE", "Web Application"],
    details: {
      cveId: "CVE-2025-54321",
      cvssScore: 9.1,
      affectedSystems: [
        "Apache Struts 2.5.x before 2.5.32",
        "Apache Struts 2.6.x before 2.6.15"
      ]
    }
  },
  {
    id: "threat-007",
    title: "Potential DDoS Campaign Against Financial Services",
    type: "prediction",
    severity: 7.8,
    description: "Threat intelligence indicates preparation for a large-scale DDoS campaign targeting financial services organizations in the coming weeks.",
    date: Date.now() - 3600000 * 18, // 18 hours ago
    source: "Predictive Analysis Engine",
    tags: ["DDoS", "Financial Services", "Botnet"],
    details: {
      probability: 0.76,
      confidence: 0.71,
      timeframe: "Next 21 days"
    }
  },
  {
    id: "threat-008",
    title: "Increase in Phishing Emails with Novel Techniques",
    type: "indicator",
    severity: 6.7,
    description: "A significant increase in sophisticated phishing emails using novel techniques to bypass email security systems has been observed across multiple industries.",
    date: Date.now() - 3600000 * 10, // 10 hours ago
    source: "Email Security Provider",
    tags: ["Phishing", "Email", "Social Engineering"],
    details: {
      indicatorType: "Email Campaigns",
      relatedThreatActors: ["TA505", "FIN7"],
      recommendedActions: "Update email security rules and conduct awareness training for employees"
    }
  }
];

// Component that uses the ThreatCard with mock data
const ThreatDashboardWithMockData: React.FC = () => {
  return (
    <div className="p-6 w-full">
      <h2 className="text-xl font-bold mb-2">Active Threat Intelligence</h2>
      <p className="text-gray-400 text-sm mb-4">
        Current threats, vulnerabilities, and indicators from multiple intelligence sources.
      </p>
      
      {/* Filter/sort controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1 text-xs bg-gray-800/70 hover:bg-gray-700 border border-gray-700 rounded-full">
            All Threats
          </button>
          <button className="px-3 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 rounded-full text-red-400">
            Critical (8+)
          </button>
          <button className="px-3 py-1 text-xs bg-gray-800/70 hover:bg-gray-700 border border-gray-700 rounded-full">
            Attacks
          </button>
          <button className="px-3 py-1 text-xs bg-gray-800/70 hover:bg-gray-700 border border-gray-700 rounded-full">
            Vulnerabilities
          </button>
          <button className="px-3 py-1 text-xs bg-gray-800/70 hover:bg-gray-700 border border-gray-700 rounded-full">
            Last 24h
          </button>
        </div>
        
        <div className="flex items-center text-xs text-gray-400">
          <span className="mr-2">Sort by:</span>
          <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1">
            <option>Severity (High to Low)</option>
            <option>Date (Newest First)</option>
            <option>Type</option>
          </select>
        </div>
      </div>
      
      {/* Threat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockThreats.map((threat) => (
          <ThreatCard key={threat.id} threat={threat} />
        ))}
      </div>
      
      {/* Summary and stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/30 border border-gray-700 rounded-md p-4">
          <h3 className="text-md font-bold mb-3">Threat Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Critical Threats (8+)</span>
              <span className="text-lg font-bold text-red-400">4</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Active Attacks</span>
              <span className="text-lg font-bold text-orange-400">2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">New Vulnerabilities (72h)</span>
              <span className="text-lg font-bold text-yellow-400">5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Verified Indicators</span>
              <span className="text-lg font-bold text-cyan-400">7</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">AI Predictions</span>
              <span className="text-lg font-bold text-purple-400">3</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/30 border border-gray-700 rounded-md p-4">
          <h3 className="text-md font-bold mb-3">Most Targeted Industries</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-300">Financial Services</span>
                <span className="text-cyan-400">32%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-300">Healthcare</span>
                <span className="text-cyan-400">24%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-300">Energy/Utilities</span>
                <span className="text-cyan-400">18%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-300">Government</span>
                <span className="text-cyan-400">14%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '14%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-300">Technology</span>
                <span className="text-cyan-400">12%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatDashboardWithMockData;