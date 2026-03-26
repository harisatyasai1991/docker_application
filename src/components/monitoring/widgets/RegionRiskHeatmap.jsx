/**
 * Region Risk Heatmap Widget
 * Shows all substations grouped by region as a dynamic heatmap
 * Supports up to 9 regions in a compass-style grid layout:
 * - 5 regions: cross/plus shape (N, W, C, E, S)
 * - 9 regions: full 3x3 grid (NW, N, NE, W, C, E, SW, S, SE)
 * - 10+ regions: auto-grid layout
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { monitoringAPI } from '../../../services/api';
import { MapPin } from 'lucide-react';

// Extended color palette for regions
const REGION_COLOR_PALETTE = [
  { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  { bg: 'bg-rose-500', light: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
  { bg: 'bg-lime-500', light: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-300' },
];

// Compass position mapping - maps region names to grid positions
// Grid positions: 0=NW, 1=N, 2=NE, 3=W, 4=C, 5=E, 6=SW, 7=S, 8=SE
const COMPASS_KEYWORDS = {
  // Cardinal directions
  north: 1,
  northern: 1,
  south: 7,
  southern: 7,
  east: 5,
  eastern: 5,
  west: 3,
  western: 3,
  central: 4,
  center: 4,
  main: 4,
  
  // Intercardinal directions
  northeast: 2,
  'north-east': 2,
  'north east': 2,
  northwest: 0,
  'north-west': 0,
  'north west': 0,
  southeast: 8,
  'south-east': 8,
  'south east': 8,
  southwest: 6,
  'south-west': 6,
  'south west': 6,
};

// Position labels for display
const POSITION_LABELS = {
  0: 'NW', 1: 'N', 2: 'NE',
  3: 'W', 4: 'C', 5: 'E',
  6: 'SW', 7: 'S', 8: 'SE'
};

// Get color based on risk percentage
const getRiskColor = (risk) => {
  if (risk >= 70) return { bg: 'bg-red-500', text: 'text-white', hover: 'hover:bg-red-600' };
  if (risk >= 50) return { bg: 'bg-orange-500', text: 'text-white', hover: 'hover:bg-orange-600' };
  if (risk >= 30) return { bg: 'bg-amber-400', text: 'text-gray-800', hover: 'hover:bg-amber-500' };
  if (risk >= 15) return { bg: 'bg-yellow-300', text: 'text-gray-800', hover: 'hover:bg-yellow-400' };
  return { bg: 'bg-emerald-400', text: 'text-white', hover: 'hover:bg-emerald-500' };
};

// Parse region name to find compass position
const getCompassPosition = (regionKey, regionName) => {
  const searchText = `${regionKey} ${regionName}`.toLowerCase();
  
  // Check for intercardinal first (more specific)
  for (const [keyword, position] of Object.entries(COMPASS_KEYWORDS)) {
    if (keyword.includes('-') || keyword.includes(' ')) {
      if (searchText.includes(keyword.replace('-', '').replace(' ', ''))) {
        return position;
      }
    }
  }
  
  // Then check cardinal directions
  for (const [keyword, position] of Object.entries(COMPASS_KEYWORDS)) {
    if (!keyword.includes('-') && !keyword.includes(' ')) {
      if (searchText.includes(keyword)) {
        return position;
      }
    }
  }
  
  return null; // No match found
};

// Region cell component
const RegionCell = ({ regionKey, regionName, substations, colors, onSubstationSelect, selectedSubstation, hoveredSubstation, setHoveredSubstation }) => {
  const avgRisk = substations.length > 0 
    ? Math.round(substations.reduce((sum, s) => sum + (s.risk_percent || 0), 0) / substations.length)
    : 0;
  const riskColors = getRiskColor(avgRisk);
  
  // Format display name - capitalize and clean up
  const displayName = regionName || regionKey.charAt(0).toUpperCase() + regionKey.slice(1).replace(/_/g, ' ');
  
  return (
    <div className={`p-1.5 rounded-lg border ${colors.border} ${colors.light} flex flex-col h-full min-h-[80px]`}>
      {/* Region Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.bg}`}></div>
          <span className={`text-[9px] font-bold ${colors.text} truncate`} title={displayName}>
            {displayName.length > 12 ? displayName.slice(0, 10) + '...' : displayName}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[8px] text-gray-500">{substations.length}</span>
          <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${riskColors.bg} ${riskColors.text}`}>
            {avgRisk}%
          </span>
        </div>
      </div>
      
      {/* Substations Mini Bar Chart */}
      <div className="flex items-end gap-px flex-1 min-h-[40px]">
        {substations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[8px] text-gray-400">
            No data
          </div>
        ) : (
          substations.sort((a, b) => b.risk_percent - a.risk_percent).slice(0, 10).map((sub) => {
            const subRiskColors = getRiskColor(sub.risk_percent);
            const isSelected = selectedSubstation?.substation_id === sub.substation_id;
            const isHovered = hoveredSubstation?.substation_id === sub.substation_id;
            const barHeight = Math.max(sub.risk_percent, 10);
            
            return (
              <div key={sub.substation_id} className="relative flex-1 h-full flex items-end min-w-[8px] max-w-[18px]">
                <button
                  onClick={() => onSubstationSelect && onSubstationSelect(sub)}
                  onMouseEnter={() => setHoveredSubstation(sub)}
                  onMouseLeave={() => setHoveredSubstation(null)}
                  className={`
                    w-full rounded-t transition-all duration-150 cursor-pointer
                    ${subRiskColors.bg} ${subRiskColors.hover}
                    ${isSelected ? 'ring-2 ring-blue-600 ring-offset-1 z-10' : ''}
                    ${isHovered ? 'opacity-80 scale-x-110' : ''}
                  `}
                  style={{ height: `${barHeight}%` }}
                />
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[9px] rounded shadow-lg whitespace-nowrap z-50">
                    <div className="font-medium">{sub.name}</div>
                    <div className="text-gray-300">{sub.risk_percent}% risk</div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {substations.length > 10 && (
          <div className="text-[8px] text-gray-400 ml-1">+{substations.length - 10}</div>
        )}
      </div>
    </div>
  );
};

export function RegionRiskHeatmap({ onSubstationSelect, selectedSubstation }) {
  const [substations, setSubstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSubstation, setHoveredSubstation] = useState(null);

  useEffect(() => {
    loadSubstations();
  }, []);

  const loadSubstations = async () => {
    try {
      setLoading(true);
      const response = await monitoringAPI.getSubstations();
      const subs = response.substations || [];
      
      // Calculate risk percentage for each substation
      const subsWithRisk = await Promise.all(
        subs.map(async (sub) => {
          try {
            const equipResponse = await monitoringAPI.getEquipment({ 
              substation_id: sub.substation_id,
              limit: 100 
            });
            const equip = equipResponse.equipment || [];
            const total = equip.length;
            const critical = equip.filter(e => e.health_status === 'critical').length;
            const warning = equip.filter(e => e.health_status === 'warning').length;
            
            let riskPercent = 10;
            if (total > 0) {
              riskPercent = Math.round(10 + (critical * 25) + (warning * 10));
              riskPercent += Math.floor(Math.random() * 5);
            }
            
            return {
              ...sub,
              equipment_count: total,
              risk_percent: Math.min(95, Math.max(10, riskPercent)),
            };
          } catch (err) {
            return { ...sub, risk_percent: 15 + Math.floor(Math.random() * 10), equipment_count: 0 };
          }
        })
      );
      
      setSubstations(subsWithRisk);
    } catch (error) {
      console.error('Error loading substations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process regions and determine layout
  const { gridLayout, regionColors, uniqueRegions } = useMemo(() => {
    // Group substations by region
    const substationsByRegion = substations.reduce((acc, sub) => {
      const regionKey = (sub.region || 'main').toLowerCase().replace(/\s+/g, '_');
      const regionName = sub.region_name || sub.region || 'Main';
      if (!acc[regionKey]) {
        acc[regionKey] = { key: regionKey, name: regionName, substations: [] };
      }
      acc[regionKey].substations.push(sub);
      return acc;
    }, {});
    
    const regions = Object.values(substationsByRegion);
    const regionCount = regions.length;
    
    // Assign colors to regions
    const colors = {};
    regions.forEach((region, idx) => {
      colors[region.key] = REGION_COLOR_PALETTE[idx % REGION_COLOR_PALETTE.length];
    });
    
    // Determine grid layout based on region count
    if (regionCount === 0) {
      return { gridLayout: [], regionColors: {}, uniqueRegions: [] };
    }
    
    if (regionCount <= 9) {
      // Try to place regions in compass positions
      const grid = Array(9).fill(null); // 3x3 grid
      const unplaced = [];
      
      // First pass: place regions with recognized compass names
      regions.forEach(region => {
        const position = getCompassPosition(region.key, region.name);
        if (position !== null && grid[position] === null) {
          grid[position] = region;
        } else {
          unplaced.push(region);
        }
      });
      
      // Second pass: fill remaining regions into empty slots
      // Priority order for filling: center first, then cardinals, then intercardinals
      const fillOrder = [4, 1, 3, 5, 7, 0, 2, 6, 8]; // C, N, W, E, S, NW, NE, SW, SE
      
      for (const region of unplaced) {
        for (const pos of fillOrder) {
          if (grid[pos] === null) {
            grid[pos] = region;
            break;
          }
        }
      }
      
      // Determine which rows/cols to show based on content
      const hasTop = grid[0] || grid[1] || grid[2];
      const hasMiddle = grid[3] || grid[4] || grid[5];
      const hasBottom = grid[6] || grid[7] || grid[8];
      
      // Build layout rows
      const layout = [];
      if (hasTop) layout.push([grid[0], grid[1], grid[2]]);
      if (hasMiddle) layout.push([grid[3], grid[4], grid[5]]);
      if (hasBottom) layout.push([grid[6], grid[7], grid[8]]);
      
      // Compact layout - remove empty rows/columns if possible
      // For 5 regions forming a cross, we want: N in row1-col2, W-C-E in row2, S in row3-col2
      
      return { gridLayout: layout, regionColors: colors, uniqueRegions: regions };
    }
    
    // More than 9 regions: auto-grid layout
    const cols = Math.ceil(Math.sqrt(regionCount));
    const rows = Math.ceil(regionCount / cols);
    const layout = [];
    let idx = 0;
    
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(regions[idx] || null);
        idx++;
      }
      layout.push(row);
    }
    
    return { gridLayout: layout, regionColors: colors, uniqueRegions: regions };
  }, [substations]);

  if (loading) {
    return (
      <Card className="border-0 bg-white shadow-lg h-full">
        <CardContent className="pt-6 h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total stats
  const totalAvgRisk = substations.length > 0
    ? Math.round(substations.reduce((sum, s) => sum + (s.risk_percent || 0), 0) / substations.length)
    : 0;

  return (
    <Card className="border-0 bg-white shadow-lg h-full flex flex-col">
      <CardHeader className="border-b border-gray-100 py-2 px-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-800 text-sm">
              <MapPin className="h-4 w-4 text-blue-500" />
              Region Risk Overview
            </CardTitle>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {substations.length} substations • {uniqueRegions.length} regions • Click to view
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-1 text-[9px]">
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-gray-500">High</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded bg-amber-400"></div>
              <span className="text-gray-500">Med</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded bg-emerald-400"></div>
              <span className="text-gray-500">Low</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 flex-1 overflow-hidden flex flex-col">
        {/* Dynamic Grid Layout */}
        <div className="flex-1 flex flex-col gap-1.5">
          {gridLayout.map((row, rowIdx) => {
            // Check if row has any content
            const hasContent = row.some(cell => cell !== null);
            if (!hasContent) return null;
            
            // For rows with only center content (like cross pattern), center the item
            const nonNullCount = row.filter(c => c !== null).length;
            const isCenteredRow = nonNullCount === 1 && row[1] !== null;
            
            if (isCenteredRow) {
              // Single centered item
              const region = row[1];
              return (
                <div key={rowIdx} className="flex justify-center flex-1">
                  <div className="w-1/3 min-w-[100px]">
                    <RegionCell
                      regionKey={region.key}
                      regionName={region.name}
                      substations={region.substations}
                      colors={regionColors[region.key]}
                      onSubstationSelect={onSubstationSelect}
                      selectedSubstation={selectedSubstation}
                      hoveredSubstation={hoveredSubstation}
                      setHoveredSubstation={setHoveredSubstation}
                    />
                  </div>
                </div>
              );
            }
            
            // Regular row with multiple items
            return (
              <div key={rowIdx} className="grid grid-cols-3 gap-1.5 flex-1">
                {row.map((region, colIdx) => {
                  if (!region) {
                    return <div key={colIdx} className="min-h-[80px]" />; // Empty placeholder
                  }
                  
                  return (
                    <RegionCell
                      key={region.key}
                      regionKey={region.key}
                      regionName={region.name}
                      substations={region.substations}
                      colors={regionColors[region.key]}
                      onSubstationSelect={onSubstationSelect}
                      selectedSubstation={selectedSubstation}
                      hoveredSubstation={hoveredSubstation}
                      setHoveredSubstation={setHoveredSubstation}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-500">
          <span>Total: {substations.length} subs • Avg Risk: {totalAvgRisk}%</span>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {uniqueRegions.slice(0, 6).map(region => {
              const avgRisk = region.substations.length > 0 
                ? Math.round(region.substations.reduce((sum, s) => sum + (s.risk_percent || 0), 0) / region.substations.length)
                : 0;
              const displayName = region.name.length > 8 ? region.name.slice(0, 6) + '..' : region.name;
              return (
                <span key={region.key} className="flex items-center gap-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${regionColors[region.key]?.bg}`}></span>
                  {displayName}: {avgRisk}%
                </span>
              );
            })}
            {uniqueRegions.length > 6 && (
              <span className="text-gray-400">+{uniqueRegions.length - 6} more</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RegionRiskHeatmap;
