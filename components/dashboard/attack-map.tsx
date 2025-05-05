'use client';

// Interactive Attack Map using D3.js
// This component visualizes cyber attacks on a world map

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { Topology, GeometryCollection } from 'topojson-specification';

// Types
interface Attack {
  id: string;
  attackDate: number; // Timestamp
  attackType: string;
  targetedSector: string;
  targetedRegion: string;
  impactLevel: number;
}

interface AttackNode {
  id: string;
  source: [number, number]; // [longitude, latitude]
  target: [number, number]; // [longitude, latitude]
  attackType: string;
  impactLevel: number;
  date: string;
  sector: string;
  region: string;
}

interface AttackMapProps {
  attacks: Attack[];
}

// Country code to coordinates mapping (based on real country locations)
const regionCoordinates: Record<string, [number, number]> = {
  'North America': [-100.0, 45.0],
  'United States': [-98.5795, 39.8283],
  'Canada': [-106.3468, 56.1304],
  'Mexico': [-102.5528, 23.6345],
  'Europe': [15.2551, 54.5260],
  'United Kingdom': [-3.4360, 55.3781],
  'Germany': [10.4515, 51.1657],
  'France': [2.2137, 46.2276],
  'Italy': [12.5674, 41.8719],
  'Spain': [-3.7492, 40.4637],
  'Asia': [100.6197, 34.0479],
  'China': [104.1954, 35.8617],
  'Japan': [138.2529, 36.2048],
  'India': [78.9629, 20.5937],
  'Middle East': [53.4949, 29.3375],
  'Africa': [20.2023, 6.3981],
  'South America': [-58.9301, -14.7052],
  'Brazil': [-51.9253, -14.2350],
  'Australia': [133.7751, -25.2744],
  'Global': [0, 0], // Center of the map
};

// Map attack types to colors
const attackTypeColors: Record<string, string> = {
  'ransomware': '#FF0059',
  'dataBreach': '#00FFFF',
  'ddos': '#FFD700',
  'phishing': '#00FF59',
  'malwareInfection': '#FF00FF',
  'zeroDay': '#9C59FF',
  'supplyChain': '#FF8000',
  'insiderThreat': '#00B3FF',
  'default': '#9C59FF'
};

const AttackMap: React.FC<AttackMapProps> = ({ attacks }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Handle resize for responsive design (Lecture 5)
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const { width } = svgRef.current.getBoundingClientRect();
        setDimensions({ width, height: width * 0.5 });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Fetch world map data
  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const response = await fetch('/data/world-110m.json');
        const topology = await response.json() as Topology;
        
        // Convert TopoJSON to GeoJSON
        if (topology.objects.countries) {
          const geoData = feature(
            topology,
            topology.objects.countries as GeometryCollection
          );
          setWorldData(geoData);
        }
      } catch (error) {
        console.error('Error loading map data:', error);
      }
    };
    
    fetchGeoData();
  }, []);
  
  // Convert attack data to visualization nodes
  const processAttackData = (attacks: Attack[]): AttackNode[] => {
    return attacks.map(attack => {
      // Determine target coordinates based on region
      let targetCoords = regionCoordinates[attack.targetedRegion] || regionCoordinates['Global'];
      
      // Add a small random offset to prevent overlaps
      targetCoords = [
        targetCoords[0] + (Math.random() * 2 - 1) * 5,
        targetCoords[1] + (Math.random() * 2 - 1) * 5
      ];
      
      // For source, pick a random different region
      const regions = Object.keys(regionCoordinates).filter(r => 
        r !== attack.targetedRegion && r !== 'Global'
      );
      const sourceRegion = regions[Math.floor(Math.random() * regions.length)];
      let sourceCoords = regionCoordinates[sourceRegion] || regionCoordinates['Global'];
      
      // Add a small random offset
      sourceCoords = [
        sourceCoords[0] + (Math.random() * 2 - 1) * 5,
        sourceCoords[1] + (Math.random() * 2 - 1) * 5
      ];
      
      return {
        id: attack.id,
        source: sourceCoords as [number, number],
        target: targetCoords as [number, number],
        attackType: attack.attackType,
        impactLevel: attack.impactLevel,
        date: new Date(attack.attackDate).toLocaleDateString(),
        sector: attack.targetedSector,
        region: attack.targetedRegion
      };
    });
  };
  
  // Render the map
  useEffect(() => {
    if (!worldData || !svgRef.current || !tooltipRef.current || dimensions.width === 0 || !attacks.length) {
      return;
    }
    
    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    
    // Clear previous rendering
    svg.selectAll('*').remove();
    
    // Create projection
    const projection = d3.geoMercator()
      .scale((dimensions.width + 1) / 2 / Math.PI)
      .translate([dimensions.width / 2, dimensions.height / 1.5]);
    
    // Create path generator
    const pathGenerator = d3.geoPath().projection(projection);
    
    // Add a black background rect for the globe effect
    svg.append('rect')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('fill', '#111')
      .attr('rx', 20); // Round corners
    
    // Create a group for the map
    const mapGroup = svg.append('g');
    
    // Draw world map
    mapGroup.selectAll('.country')
      .data(worldData.features)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', pathGenerator)
      .attr('fill', '#1e293b')
      .attr('stroke', '#334155')
      .attr('stroke-width', 0.5);
    
    // Add a subtle grid overlay for cyberpunk effect
    const gridSize = 20;
    const gridGroup = svg.append('g').attr('class', 'grid');
    
    // Horizontal grid lines
    for (let y = 0; y < dimensions.height; y += gridSize) {
      gridGroup.append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', dimensions.width)
        .attr('y2', y)
        .attr('stroke', 'rgba(0, 255, 255, 0.1)')
        .attr('stroke-width', 0.5);
    }
    
    // Vertical grid lines
    for (let x = 0; x < dimensions.width; x += gridSize) {
      gridGroup.append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', dimensions.height)
        .attr('stroke', 'rgba(0, 255, 255, 0.1)')
        .attr('stroke-width', 0.5);
    }
    
    // Process attack data
    const attackNodes = processAttackData(attacks);
    
    // Create defs for gradient and filters
    const defs = svg.append('defs');
    
    // Add glow filter
    defs.append('filter')
      .attr('id', 'glow')
      .append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');
    
    // Add arrow marker for attack lines
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 5)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'rgba(255, 255, 255, 0.7)');
    
    // Add gradients for each attack type
    Object.entries(attackTypeColors).forEach(([type, color]) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${type}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0.8);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0.2);
    });
    
    // Add pulsing animation
    const pulseAnimation = defs
      .append('animate')
      .attr('id', 'pulse')
      .attr('attributeName', 'r')
      .attr('values', '5;8;5')
      .attr('dur', '2s')
      .attr('repeatCount', 'indefinite');
    
    // Draw attack flow lines
    svg.selectAll('.attack-line')
      .data(attackNodes)
      .enter()
      .append('path')
      .attr('class', 'attack-line')
      .attr('d', d => {
        const sourcePoint = projection(d.source) || [0, 0];
        const targetPoint = projection(d.target) || [0, 0];
        
        // Create curved path between points
        return `M${sourcePoint[0]},${sourcePoint[1]} Q${(sourcePoint[0] + targetPoint[0]) / 2},${
          (sourcePoint[1] + targetPoint[1]) / 2 - 50} ${targetPoint[0]},${targetPoint[1]}`;
      })
      .attr('stroke', d => attackTypeColors[d.attackType] || attackTypeColors.default)
      .attr('stroke-width', d => 1 + (d.impactLevel / 10))
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.4)
      .attr('marker-end', 'url(#arrow)')
      .style('stroke-dasharray', '4,4')
      .style('animation', d => `dash ${2 + Math.random() * 3}s linear infinite`);
    
    // Draw attack origin points
    svg.selectAll('.attack-origin')
      .data(attackNodes)
      .enter()
      .append('circle')
      .attr('class', 'attack-origin')
      .attr('cx', d => projection(d.source)?.[0] || 0)
      .attr('cy', d => projection(d.source)?.[1] || 0)
      .attr('r', 3)
      .attr('fill', d => attackTypeColors[d.attackType] || attackTypeColors.default)
      .attr('filter', 'url(#glow)')
      .attr('opacity', 0.7);
    
    // Draw attack target points
    svg.selectAll('.attack-target')
      .data(attackNodes)
      .enter()
      .append('circle')
      .attr('class', 'attack-target')
      .attr('cx', d => projection(d.target)?.[0] || 0)
      .attr('cy', d => projection(d.target)?.[1] || 0)
      .attr('r', d => 3 + (d.impactLevel / 2))
      .attr('fill', d => attackTypeColors[d.attackType] || attackTypeColors.default)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('filter', 'url(#glow)')
      .attr('opacity', 0.9)
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 30}px`)
          .html(`
            <div class="font-bold text-xs mb-1">${formatAttackType(d.attackType)}</div>
            <div class="text-xs">Target: ${d.sector} (${d.region})</div>
            <div class="text-xs">Date: ${d.date}</div>
            <div class="text-xs">Impact: ${d.impactLevel.toFixed(1)}/10</div>
          `);
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      });
    
    // Add pulsing effect to new attacks
    svg.selectAll('.attack-pulse')
      .data(attackNodes.filter((_, i) => i < 5)) // Only most recent attacks pulse
      .enter()
      .append('circle')
      .attr('class', 'attack-pulse')
      .attr('cx', d => projection(d.target)?.[0] || 0)
      .attr('cy', d => projection(d.target)?.[1] || 0)
      .attr('r', 5)
      .attr('fill', 'none')
      .attr('stroke', d => attackTypeColors[d.attackType] || attackTypeColors.default)
      .attr('stroke-width', 1)
      .attr('opacity', 0.8)
      .style('animation', 'pulse 1.5s ease-out infinite');
    
    // Add legend
    const legendData = [
      { type: 'ransomware', label: 'Ransomware' },
      { type: 'dataBreach', label: 'Data Breach' },
      { type: 'ddos', label: 'DDoS' },
      { type: 'zeroDay', label: 'Zero-Day' },
      { type: 'supplyChain', label: 'Supply Chain' },
    ];
    
    const legend = svg.append('g')
      .attr('transform', `translate(20, ${dimensions.height - (legendData.length * 25) - 20})`);
    
    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`);
    
    legendItems.append('circle')
      .attr('r', 6)
      .attr('fill', d => attackTypeColors[d.type])
      .attr('filter', 'url(#glow)');
    
    legendItems.append('text')
      .attr('x', 15)
      .attr('y', 5)
      .text(d => d.label)
      .attr('fill', '#fff')
      .attr('font-size', '12px');
    
  }, [worldData, dimensions, attacks]);
  
  return (
    <div className="relative w-full h-full">
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%"
        className="rounded-lg overflow-hidden"
      />
      <div 
        ref={tooltipRef}
        className="absolute bg-gray-900/90 border border-cyan-500/50 rounded p-2 text-white text-sm pointer-events-none opacity-0 transition-opacity z-10"
        style={{ 
          filter: 'drop-shadow(0 0 5px rgba(0, 255, 255, 0.5))',
          backdropFilter: 'blur(4px)'
        }}
      />
      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 16;
          }
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to format attack types for display
function formatAttackType(type: string): string {
  const typeMap: Record<string, string> = {
    'ransomware': 'Ransomware',
    'dataBreach': 'Data Breach',
    'ddos': 'DDoS Attack',
    'zeroDay': 'Zero-Day Exploit',
    'phishing': 'Phishing Campaign',
    'supplyChain': 'Supply Chain Attack',
    'insiderThreat': 'Insider Threat',
    'malwareInfection': 'Malware Infection'
  };
  
  return typeMap[type] || type;
}

export default AttackMap;