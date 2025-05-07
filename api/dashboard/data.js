// File: pages/api/dashboard/data.js
export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    try {
      // Mock data for dashboard
      const dashboardData = {
        stats: {
          totalThreats: 124,
          criticalVulnerabilities: 7,
          activeMitigations: 18,
          threatLevel: 'Medium',
          securityScore: 76,
          lastUpdated: new Date().toISOString()
        },
        threats: [
          {
            id: '1',
            type: 'Ransomware',
            severity: 'Critical',
            source: 'Dark Web',
            timestamp: new Date().toISOString(),
            target: 'Financial Systems',
            status: 'Active',
            description: 'New ransomware variant targeting financial institutions'
          },
          {
            id: '2',
            type: 'DDoS',
            severity: 'High',
            source: 'External Network',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            target: 'Public Website',
            status: 'Mitigated',
            description: 'Distributed denial of service attack detected on public-facing website'
          },
          {
            id: '3',
            type: 'Phishing',
            severity: 'Medium',
            source: 'Email',
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            target: 'Employees',
            status: 'Active',
            description: 'Targeted phishing campaign aimed at executive team members'
          }
        ],
        vulnerabilities: [
          {
            id: '1',
            cveId: 'CVE-2025-1234',
            name: 'Authentication Bypass',
            severity: 'Critical',
            affectedSystems: ['API Gateway', 'Authentication Service'],
            status: 'Open',
            discoveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Authentication bypass vulnerability in API gateway allowing unauthorized access'
          },
          {
            id: '2',
            cveId: 'CVE-2025-5678',
            name: 'SQL Injection',
            severity: 'High',
            affectedSystems: ['Customer Database'],
            status: 'In Progress',
            discoveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'SQL injection vulnerability in customer data query endpoint'
          },
          {
            id: '3',
            cveId: 'CVE-2025-9012',
            name: 'XSS Vulnerability',
            severity: 'Medium',
            affectedSystems: ['Internal Wiki'],
            status: 'Mitigated',
            discoveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Cross-site scripting vulnerability in wiki comment system'
          }
        ],
        attackMap: {
          attacks: [
            { source: 'Beijing, China', target: 'New York, USA', type: 'DDoS', count: 235 },
            { source: 'Moscow, Russia', target: 'London, UK', type: 'Brute Force', count: 189 },
            { source: 'Sao Paulo, Brazil', target: 'Toronto, Canada', type: 'Ransomware', count: 78 },
            { source: 'Lagos, Nigeria', target: 'Paris, France', type: 'Phishing', count: 142 },
            { source: 'Sydney, Australia', target: 'Tokyo, Japan', type: 'SQL Injection', count: 56 },
            { source: 'Mumbai, India', target: 'Singapore', type: 'XSS', count: 93 },
            { source: 'Tehran, Iran', target: 'Berlin, Germany', type: 'Zero-day', count: 42 },
            { source: 'Seoul, South Korea', target: 'San Francisco, USA', type: 'Data Exfiltration', count: 118 }
          ],
          totalAttacks: 953,
          topSourceCountries: [
            { country: 'China', count: 287 },
            { country: 'Russia', count: 253 },
            { country: 'Nigeria', count: 186 },
            { country: 'Brazil', count: 124 },
            { country: 'India', count: 103 }
          ]
        },
        predictions: [
          {
            id: '1',
            threatType: 'Ransomware',
            probability: 0.78,
            potentialImpact: 'High',
            targetedSystems: ['File Servers', 'Backup Systems'],
            timeframe: 'Next 7 days',
            description: 'High probability of ransomware targeting backup infrastructure based on recent dark web chatter'
          },
          {
            id: '2',
            threatType: 'Phishing',
            probability: 0.65,
            potentialImpact: 'Medium',
            targetedSystems: ['Email Users', 'VPN Access'],
            timeframe: 'Next 14 days',
            description: 'Medium-high probability of targeted phishing campaign against executive staff'
          },
          {
            id: '3',
            threatType: 'DDoS',
            probability: 0.42,
            potentialImpact: 'Medium',
            targetedSystems: ['Public Website', 'Customer Portal'],
            timeframe: 'Next 30 days',
            description: 'Moderate probability of distributed denial of service attacks based on seasonal patterns'
          }
        ]
      };
  
      return res.status(200).json(dashboardData);
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }