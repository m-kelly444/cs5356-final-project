'use client';

// ThreatMeter component
// A cyberpunk-styled gauge that displays the current threat level

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ThreatMeterProps {
  level: number; // 0-100 threat level
}

const ThreatMeter: React.FC<ThreatMeterProps> = ({ level }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const previousLevel = useRef<number>(0);
  
  // Format the threat level text
  const threatLevelText = () => {
    if (level >= 80) return 'CRITICAL';
    if (level >= 60) return 'HIGH';
    if (level >= 40) return 'ELEVATED';
    if (level >= 20) return 'GUARDED';
    return 'LOW';
  };
  
  // Get the threat level color
  const threatLevelColor = () => {
    if (level >= 80) return '#FF0043';
    if (level >= 60) return '#FF5E00';
    if (level >= 40) return '#FFBD00';
    if (level >= 20) return '#00BFFF';
    return '#00FF66';
  };
  
  // Calculate the arc path for the gauge
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const width = 400;
    const height = 200;
    const radius = Math.min(width, height * 2) / 2;
    
    // Clear any existing content
    svg.selectAll('*').remove();
    
    // Create the SVG structure
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height})`);
    
    // Create defs for gradients and filters
    const defs = svg.append('defs');
    
    // Add glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3.5')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    // Create gradient for gauge background
    const backgroundGradient = defs.append('linearGradient')
      .attr('id', 'backgroundGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    
    backgroundGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2D3747')
      .attr('stop-opacity', 1);
    
    backgroundGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1A202C')
      .attr('stop-opacity', 1);
    
    // Create gradient for gauge fill
    const fillGradient = defs.append('linearGradient')
      .attr('id', 'fillGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    
    fillGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#00FF66')
      .attr('stop-opacity', 1);
    
    fillGradient.append('stop')
      .attr('offset', '40%')
      .attr('stop-color', '#FFBD00')
      .attr('stop-opacity', 1);
    
    fillGradient.append('stop')
      .attr('offset', '75%')
      .attr('stop-color', '#FF5E00')
      .attr('stop-opacity', 1);
    
    fillGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#FF0043')
      .attr('stop-opacity', 1);
    
    // Create arc generator
    const arc = d3.arc()
      .innerRadius(radius - 40)
      .outerRadius(radius - 10)
      .startAngle(-Math.PI)
      .endAngle(0);
    
    // Draw background arc
    g.append('path')
      .datum({ endAngle: Math.PI / 2 })
      .attr('d', arc as any)
      .attr('fill', 'url(#backgroundGradient)')
      .attr('stroke', '#4A5568')
      .attr('stroke-width', 1);
    
    // Draw the value arc
    const value = level / 100; // Normalize to 0-1
    const angleScale = d3.scaleLinear()
      .domain([0, 1])
      .range([-Math.PI, 0]);
    
    const valueArc = d3.arc()
      .innerRadius(radius - 40)
      .outerRadius(radius - 10)
      .startAngle(-Math.PI)
      .endAngle(angleScale(0)); // Start at 0
    
    // Create the path with initial angle
    const path = g.append('path')
      .datum({ endAngle: angleScale(0) })
      .attr('d', valueArc as any)
      .attr('fill', 'url(#fillGradient)')
      .attr('filter', 'url(#glow)');
    
    // Animate the arc from the previous value to the new value
    path.transition()
      .duration(1000)
      .attrTween('d', (d: any) => {
        const startAngle = angleScale(previousLevel.current / 100);
        const endAngle = angleScale(value);
        const interpolate = d3.interpolate(
          { endAngle: startAngle || -Math.PI },
          { endAngle }
        );
        return (t: number) => valueArc(interpolate(t)) as string;
      });
    
    // Update the previous level ref
    previousLevel.current = level;
    
    // Add tick marks
    const tickScale = d3.scaleLinear()
      .domain([0, 100])
      .range([-Math.PI, 0]);
    
    const tickData = [0, 20, 40, 60, 80, 100];
    
    // Add tick marks
    g.selectAll('.tick')
      .data(tickData)
      .enter()
      .append('line')
      .attr('class', 'tick')
      .attr('x1', d => (radius - 42) * Math.cos(tickScale(d)))
      .attr('y1', d => (radius - 42) * Math.sin(tickScale(d)))
      .attr('x2', d => (radius - 8) * Math.cos(tickScale(d)))
      .attr('y2', d => (radius - 8) * Math.sin(tickScale(d)))
      .attr('stroke', '#CBD5E0')
      .attr('stroke-width', d => d % 40 === 0 ? 2 : 1)
      .attr('opacity', 0.6);
    
    // Add tick labels
    g.selectAll('.tick-label')
      .data(tickData)
      .enter()
      .append('text')
      .attr('class', 'tick-label')
      .attr('x', d => (radius - 55) * Math.cos(tickScale(d)))
      .attr('y', d => (radius - 55) * Math.sin(tickScale(d)))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#CBD5E0')
      .attr('font-size', '10px')
      .text(d => d.toString());
    
    // Add needle
    const needlePath = d3.line()
      .x(d => d[0])
      .y(d => d[1]);
    
    const needlePoints = [
      [0, -10],
      [-5, 0],
      [0, (radius - 45)],
      [5, 0],
      [0, -10]
    ];
    
    const needleGroup = g.append('g')
      .attr('class', 'needle')
      .style('transform-origin', '0 0')
      .style('transform', 'rotate(-180deg)'); // Start at minimum
    
    needleGroup.append('path')
      .attr('d', needlePath(needlePoints as [number, number][]))
      .attr('fill', threatLevelColor())
      .attr('stroke', '#E2E8F0')
      .attr('stroke-width', 1)
      .attr('filter', 'url(#glow)');
    
    // Add central circle
    needleGroup.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 10)
      .attr('fill', threatLevelColor())
      .attr('stroke', '#E2E8F0')
      .attr('stroke-width', 1)
      .attr('filter', 'url(#glow)');
    
    // Animate the needle
    const needleAngle = angleScale(value) * (180 / Math.PI);
    needleGroup.transition()
      .duration(1000)
      .style('transform', `rotate(${needleAngle}deg)`);
    
    // Add central text
    g.append('text')
      .attr('class', 'threat-value')
      .attr('x', 0)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', threatLevelColor())
      .attr('font-size', '36px')
      .attr('font-weight', 'bold')
      .attr('filter', 'url(#glow)')
      .text(level.toString());
    
    g.append('text')
      .attr('class', 'threat-label')
      .attr('x', 0)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('fill', threatLevelColor())
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('filter', 'url(#glow)')
      .text(threatLevelText());
    
  }, [level]);
  
  return (
    <div className="w-full flex flex-col items-center">
      <svg 
        ref={svgRef} 
        viewBox="0 0 400 200"
        width="100%"
        height="200"
        className="overflow-visible"
      />
      <div className="cyber-grid mt-4 w-full max-w-lg">
        <div className="grid grid-cols-5 text-center text-xs border border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-green-800/30 p-2">
            <div className="font-bold">LOW</div>
            <div>0-20</div>
          </div>
          <div className="bg-blue-800/30 p-2">
            <div className="font-bold">GUARDED</div>
            <div>21-40</div>
          </div>
          <div className="bg-yellow-800/30 p-2">
            <div className="font-bold">ELEVATED</div>
            <div>41-60</div>
          </div>
          <div className="bg-orange-800/30 p-2">
            <div className="font-bold">HIGH</div>
            <div>61-80</div>
          </div>
          <div className="bg-red-800/30 p-2">
            <div className="font-bold">CRITICAL</div>
            <div>81-100</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatMeter;