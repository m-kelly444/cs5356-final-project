'use client';

import React from 'react';
import AttackMap from './attack-map'; // Using your original component

// Mock data for cyber attacks visualization
const mockAttacks = [
  {
    id: "attack-001",
    attackDate: Date.now() - 3600000, // 1 hour ago
    attackType: "ransomware",
    targetedSector: "Financial",
    targetedRegion: "North America",
    impactLevel: 8,
    title: "Ransomware Attack on Financial Institution"
  },
  {
    id: "attack-002",
    attackDate: Date.now() - 7200000, // 2 hours ago
    attackType: "ddos",
    targetedSector: "Technology",
    targetedRegion: "Europe",
    impactLevel: 6,
    title: "DDoS Attack on Tech Company"
  },
  {
    id: "attack-003",
    attackDate: Date.now() - 10800000, // 3 hours ago
    attackType: "phishing",
    targetedSector: "Healthcare",
    targetedRegion: "Asia",
    impactLevel: 7,
    title: "Phishing Campaign Targeting Healthcare Workers"
  },
  {
    id: "attack-004",
    attackDate: Date.now() - 14400000, // 4 hours ago
    attackType: "malwareInfection",
    targetedSector: "Government",
    targetedRegion: "United States",
    impactLevel: 9,
    title: "Government Agency Malware Infection"
  },
  {
    id: "attack-005",
    attackDate: Date.now() - 18000000, // 5 hours ago
    attackType: "zeroDay",
    targetedSector: "Critical Infrastructure",
    targetedRegion: "Middle East",
    impactLevel: 9,
    title: "Zero-Day Exploit Targeting Energy Sector"
  },
  {
    id: "attack-006",
    attackDate: Date.now() - 21600000, // 6 hours ago
    attackType: "insiderThreat",
    targetedSector: "Defense",
    targetedRegion: "United Kingdom",
    impactLevel: 7,
    title: "Insider Threat at Defense Contractor"
  },
  {
    id: "attack-007",
    attackDate: Date.now() - 25200000, // 7 hours ago
    attackType: "supplyChain",
    targetedSector: "Manufacturing",
    targetedRegion: "Germany",
    impactLevel: 8,
    title: "Supply Chain Attack on Manufacturing Company"
  },
  {
    id: "attack-008",
    attackDate: Date.now() - 28800000, // 8 hours ago
    attackType: "phishing",
    targetedSector: "Education",
    targetedRegion: "Australia",
    impactLevel: 5,
    title: "Phishing Campaign Targeting Universities"
  },
  {
    id: "attack-009",
    attackDate: Date.now() - 32400000, // 9 hours ago
    attackType: "ransomware",
    targetedSector: "Healthcare",
    targetedRegion: "Brazil",
    impactLevel: 8,
    title: "Ransomware Attack on Hospital Systems"
  },
  {
    id: "attack-010",
    attackDate: Date.now() - 36000000, // 10 hours ago
    attackType: "ddos",
    targetedSector: "Media",
    targetedRegion: "Japan",
    impactLevel: 6,
    title: "DDoS Attack on Media Organization"
  },
  {
    id: "attack-011",
    attackDate: Date.now() - 39600000, // 11 hours ago
    attackType: "malwareInfection",
    targetedSector: "Retail",
    targetedRegion: "France",
    impactLevel: 7,
    title: "POS Malware Infection at Retail Chain"
  },
  {
    id: "attack-012",
    attackDate: Date.now() - 43200000, // 12 hours ago
    attackType: "zeroDay",
    targetedSector: "Technology",
    targetedRegion: "India",
    impactLevel: 9,
    title: "Zero-Day Exploit in Cloud Infrastructure"
  }
];

// Component that uses the AttackMap with mock data
const AttackMapWithMockData: React.FC = () => {
  return (
    <div className="p-6 w-full">
      <h2 className="text-xl font-bold mb-2">Global Attack Map</h2>
      <p className="text-gray-400 text-sm mb-4">
        Real-time visualization of cyber attacks around the world. Lines indicate attack vectors and targets.
      </p>
      
      <div className="h-[600px] w-full border border-gray-700 rounded-lg overflow-hidden">
        {/* Render the AttackMap with mock data */}
        <AttackMap attacks={mockAttacks} />
      </div>
      
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 p-3 rounded-md border border-gray-700">
          <h3 className="text-sm font-bold mb-1">Total Attacks</h3>
          <p className="text-2xl font-bold text-cyan-400">{mockAttacks.length}</p>
          <p className="text-xs text-gray-400 mt-1">Last 12 hours</p>
        </div>
        
        <div className="bg-gray-800/50 p-3 rounded-md border border-gray-700">
          <h3 className="text-sm font-bold mb-1">Top Target</h3>
          <p className="text-xl font-bold text-cyan-400">Technology</p>
          <p className="text-xs text-gray-400 mt-1">3 attacks (25%)</p>
        </div>
        
        <div className="bg-gray-800/50 p-3 rounded-md border border-gray-700">
          <h3 className="text-sm font-bold mb-1">Primary Attack Type</h3>
          <p className="text-xl font-bold text-cyan-400">Ransomware</p>
          <p className="text-xs text-gray-400 mt-1">33% of all attacks</p>
        </div>
        
        <div className="bg-gray-800/50 p-3 rounded-md border border-gray-700">
          <h3 className="text-sm font-bold mb-1">Avg. Impact Level</h3>
          <p className="text-2xl font-bold text-cyan-400">7.3</p>
          <p className="text-xs text-gray-400 mt-1">High severity</p>
        </div>
      </div>
    </div>
  );
};

export default AttackMapWithMockData;