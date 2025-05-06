"use client"
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section with Cyberpunk Theme */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-1 z-0 opacity-30">
          {Array.from({ length: 72 }).map((_, i) => (
            <div 
              key={i} 
              className="bg-gray-900 border border-cyan-500/20"
              style={{
                animation: `pulse ${Math.random() * 3 + 2}s infinite alternate`,
              }}
            />
          ))}
        </div>
        
        {/* Animated circuit lines */}
        <div className="absolute inset-0 z-0">
          <svg width="100%" height="100%" className="opacity-20">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Horizontal lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <line 
                key={`h-${i}`}
                x1="0" 
                y1={`${(i + 1) * 10}%`} 
                x2="100%" 
                y2={`${(i + 1) * 10}%`}
                stroke="cyan" 
                strokeWidth="1" 
                strokeDasharray="10,30,60" 
                strokeDashoffset={i * 37}
                filter="url(#glow)"
              >
                <animate 
                  attributeName="stroke-dashoffset" 
                  values={`${i * 100};${i * -100}`} 
                  dur={`${20 + i * 5}s`} 
                  repeatCount="indefinite" 
                />
              </line>
            ))}
            
            {/* Vertical lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <line 
                key={`v-${i}`}
                x1={`${(i + 1) * 10}%`} 
                y1="0" 
                x2={`${(i + 1) * 10}%`} 
                y2="100%"
                stroke="magenta" 
                strokeWidth="1" 
                strokeDasharray="20,40,5" 
                strokeDashoffset={i * 43}
                filter="url(#glow)"
              >
                <animate 
                  attributeName="stroke-dashoffset" 
                  values={`${i * -100};${i * 100}`} 
                  dur={`${25 + i * 3}s`} 
                  repeatCount="indefinite" 
                />
              </line>
            ))}
          </svg>
        </div>
        
        <div className="cyber-card p-8 max-w-4xl w-full mx-auto z-10 border border-cyan-500/50 shadow-lg shadow-cyan-500/20">
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-fuchsia-500">
            CyberPulse
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-gray-300">
            Real-time cyber threat prediction powered by machine learning
          </p>
          
          <div className="relative h-64 mb-8 overflow-hidden rounded-lg border border-cyan-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-lg" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center z-10 p-6">
                <h2 className="text-2xl font-bold mb-4 text-fuchsia-400">
                  Predictive Cyber Threat Intelligence
                </h2>
                <p className="max-w-lg mx-auto text-gray-300">
                  CyberPulse leverages machine learning and real-time data from CISA, NVD, and other authoritative sources to predict cyber attacks before they happen.
                </p>
              </div>
            </div>
            
            {/* Animated nodes in the background */}
            <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 800 400">
              <defs>
                <radialGradient id="node-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="rgba(0, 255, 255, 0.8)" />
                  <stop offset="100%" stopColor="rgba(0, 255, 255, 0)" />
                </radialGradient>
              </defs>
              
              {Array.from({ length: 20 }).map((_, i) => {
                const x = Math.random() * 800;
                const y = Math.random() * 400;
                const radius = Math.random() * 3 + 1;
                
                return (
                  <g key={i}>
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={radius} 
                      fill="url(#node-gradient)"
                      filter="url(#glow)"
                    >
                      <animate 
                        attributeName="opacity" 
                        values="0.3;1;0.3" 
                        dur={`${Math.random() * 3 + 2}s`} 
                        repeatCount="indefinite" 
                      />
                    </circle>
                    
                    {/* Connect some nodes with lines */}
                    {Math.random() > 0.5 && (
                      <line 
                        x1={x} 
                        y1={y} 
                        x2={Math.random() * 800} 
                        y2={Math.random() * 400}
                        stroke="cyan" 
                        strokeWidth="0.5" 
                        strokeOpacity="0.2"
                      >
                        <animate 
                          attributeName="stroke-opacity" 
                          values="0.1;0.3;0.1" 
                          dur={`${Math.random() * 4 + 3}s`} 
                          repeatCount="indefinite" 
                        />
                      </line>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="cyber-border bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 px-8 rounded-md transition-all"
            >
              Log In
            </Link>
            <Link 
              href="/auth/register" 
              className="cyber-border bg-transparent hover:bg-fuchsia-900/30 text-fuchsia-400 font-bold py-3 px-8 border border-fuchsia-500 rounded-md transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
        
        {/* Feature Section */}
        <div className="mt-16 max-w-6xl w-full mx-auto z-10">
          <h2 className="text-2xl font-bold mb-8 text-cyan-400">Key Features</h2>
          
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="cyber-card p-6 border border-gray-700 hover:border-cyan-600/50 transition-colors"
              >
                <div className="h-12 w-12 mb-4 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Data Sources Section */}
        <div className="mt-16 max-w-4xl w-full mx-auto z-10">
          <h2 className="text-2xl font-bold mb-6 text-cyan-400">Powered by Real Data</h2>
          <p className="text-gray-300 mb-8">
            CyberPulse integrates with authoritative cybersecurity data sources to provide accurate, up-to-date threat intelligence.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {dataSources.map((source, index) => (
              <div 
                key={index} 
                className="border border-gray-700 rounded-lg p-4 text-center hover:border-cyan-500/30 transition-colors"
              >
                <div className="text-lg font-bold text-white mb-1">{source.name}</div>
                <div className="text-sm text-gray-400">{source.type}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900/50 backdrop-blur-sm py-8 z-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>© 2025 CyberPulse | Cybersecurity Intelligence Platform</p>
          <p className="mt-2 text-sm">
            Built with Next.js, React, and TensorFlow.js using real-time cyber threat data
          </p>
        </div>
      </footer>
      
      {/* Global styles for the landing page */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 0.2;
          }
          100% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}

// Feature data
const features = [
  {
    icon: '🔮',
    title: "Threat Prediction",
    description: "Machine learning algorithms analyze patterns to predict potential cyber attacks before they happen."
  },
  {
    icon: '⚡️',
    title: "Real-time Monitoring",
    description: "Stay updated with real-time alerts and notifications about emerging threats from authoritative sources."
  },
  {
    icon: '📊',
    title: "Risk Assessment",
    description: "Evaluate vulnerability and risk levels for organizations across different sectors."
  },
  {
    icon: '🌎',
    title: "Interactive Visualizations",
    description: "Explore threat data through intuitive, interactive cyberpunk-styled visualizations."
  },
  {
    icon: '📈',
    title: "Trend Analysis",
    description: "Analyze historical attack patterns to identify trends and forecast future threat landscapes."
  },
  {
    icon: '🔒',
    title: "Secure Authentication",
    description: "Enterprise-grade security ensures your threat intelligence data remains protected."
  }
];

// Data sources
const dataSources = [
  {
    name: "CISA KEV",
    type: "Exploited Vulnerabilities"
  },
  {
    name: "NVD",
    type: "Vulnerability Database"
  },
  {
    name: "VirusTotal",
    type: "Malware Intelligence"
  },
  {
    name: "URLhaus",
    type: "Malicious URLs"
  },
  {
    name: "PhishTank",
    type: "Phishing Data"
  },
  {
    name: "MITRE ATT&CK",
    type: "Attack Techniques"
  },
  {
    name: "AbuseIPDB",
    type: "Abusive IP Addresses"
  },
  {
    name: "CIRCL",
    type: "Threat Intelligence"
  }
];