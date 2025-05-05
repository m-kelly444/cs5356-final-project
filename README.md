# CyberPulse: Predictive Cybersecurity Intelligence Dashboard

![CyberPulse Dashboard](docs/dashboard-preview.png)

## Overview

CyberPulse is a real-time cybersecurity threat prediction platform built using Next.js, React, and TensorFlow.js. It analyzes data from authoritative sources such as CISA's Known Exploited Vulnerabilities (KEV) Catalog and the National Vulnerability Database (NVD) to predict potential cyber threats before they happen.

This full-stack application was developed for the CS 5356 course at Cornell Tech, combining modern web technologies with machine learning to create a powerful cybersecurity intelligence tool.

## Key Features

- 🔮 **Predictive Analytics**: ML-powered prediction of cyber attack patterns and targets
- 🌐 **Interactive Attack Map**: Visual global representation of cyber threats
- 📊 **Real-Time Monitoring**: Live data from authoritative cybersecurity sources
- 🔍 **Vulnerability Assessment**: Analysis of critical vulnerabilities and their potential impact
- 🔒 **Secure Authentication**: User accounts with role-based access

## Real Data Sources

CyberPulse integrates with genuine cybersecurity data sources:

- **CISA Known Exploited Vulnerabilities (KEV) Catalog**: Authoritative source of vulnerabilities that have been exploited in the wild
- **National Vulnerability Database (NVD)**: Comprehensive vulnerability data from the U.S. government repository
- **PhishTank**: Community-driven platform for phishing URL data
- **URLhaus**: Tracks and shares information about URLs used for malware distribution
- **Other OSINT feeds**: Additional open-source intelligence sources

## Technology Stack

### Frontend
- **Next.js** (App Router): Full-stack React framework with server components
- **React**: UI component library
- **TailwindCSS**: Utility-first CSS framework with custom cyberpunk theme
- **D3.js**: Interactive data visualizations
- **Framer Motion**: UI animations

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Drizzle ORM**: Type-safe database queries with SQLite
- **NextAuth.js**: Authentication framework
- **TensorFlow.js**: Machine learning for threat prediction

### Deployment & DevOps
- **Docker**: Containerization for reliable deployment
- **GitHub Actions**: CI/CD pipeline for automated testing and deployment
- **SQLite**: Database for development (can be replaced with PostgreSQL in production)

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Git
- API keys for data sources (optional, but recommended for full functionality)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/cyberpulse.git
cd cyberpulse
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your API keys and configuration.

4. Set up the database:
```bash
npm run db:generate
npm run db:migrate
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
cyberpulse/
├── app/                           # Next.js App Router
│   ├── api/                       # API routes
│   ├── auth/                      # Authentication pages
│   ├── dashboard/                 # Dashboard pages
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
├── components/                    # React components
│   ├── dashboard/                 # Dashboard components
│   ├── layout/                    # Layout components
│   └── ui/                        # UI components
├── lib/                           # Shared libraries
│   ├── api/                       # API clients
│   ├── auth/                      # Auth utilities
│   ├── db/                        # Database
│   ├── ml/                        # Machine learning
│   └── utils/                     # Utilities
├── public/                        # Static assets
└── types/                         # TypeScript types
```

## Features in Detail

### Predictive Analytics
The system uses machine learning to analyze historical cyber attack patterns and vulnerability data to predict potential future threats. The model generates predictions about:

- Which sectors are most likely to be targeted
- What types of attacks are probable
- Which vulnerabilities are likely to be exploited

### Interactive Attack Map
A global visualization of cyber attacks showing:
- Attack origins and targets
- Attack types and severity
- Temporal patterns and trends

### Vulnerability Assessment
Analysis of vulnerabilities from authoritative sources including:
- CVSS scores and severity
- Exploitation status
- Affected systems and software
- Remediation guidance

### Real-time Monitoring
Continuous monitoring of threat intelligence feeds showing:
- Recently discovered vulnerabilities
- New cyber attacks
- Emerging threat actors
- Phishing and malware URLs

## Deployment

The application can be deployed using Docker:

```bash
docker-compose up -d
```

For production deployment, consider:
- Setting up a proper database (PostgreSQL)
- Using a reverse proxy (Nginx)
- Setting up SSL
- Implementing proper monitoring

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Cornell Tech CS 5356 course for the inspiration and guidance
- CISA and NVD for providing valuable cybersecurity data
- The open-source community for the amazing tools and libraries