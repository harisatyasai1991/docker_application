/**
 * Equipment Type Summary Widget
 * Shows equipment breakdown by type with status counts
 * Compact view for quick glance
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { 
  Cpu,
  Zap,
  Cable,
  Box,
  CircuitBoard,
  XCircle,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { monitoringAPI } from '../../../services/api';

// Equipment type icons
const TYPE_ICONS = {
  'power_transformer': Zap,
  'gis_switchgear': CircuitBoard,
  'cable_termination': Cable,
  'circuit_breaker': Box,
  'current_transformer': Cpu,
  'voltage_transformer': Cpu,
  'default': Cpu
};

// Friendly names for equipment types
const TYPE_NAMES = {
  'power_transformer': 'Power Transformer',
  'gis_switchgear': 'GIS Switchgear',
  'cable_termination': 'Cable Termination',
  'circuit_breaker': 'Circuit Breaker',
  'current_transformer': 'Current Transformer',
  'voltage_transformer': 'Voltage Transformer'
};

export function EquipmentTypeSummary({ config = {} }) {
  const [typeData, setTypeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEquipment, setTotalEquipment] = useState(0);

  useEffect(() => {
    const fetchEquipmentByType = async () => {
      try {
        // Fetch all equipment
        const response = await monitoringAPI.getEquipment({ limit: 500 });
        const equipment = response.equipment || [];
        
        setTotalEquipment(equipment.length);
        
        // Group by type and calculate stats
        const typeMap = {};
        equipment.forEach(eq => {
          const type = eq.equipment_type || 'unknown';
          if (!typeMap[type]) {
            typeMap[type] = {
              type,
              count: 0,
              critical: 0,
              warning: 0,
              healthy: 0,
              totalRisk: 0
            };
          }
          typeMap[type].count++;
          
          // Count by status
          if (eq.health_status === 'critical') {
            typeMap[type].critical++;
            typeMap[type].totalRisk += 90;
          } else if (eq.health_status === 'warning') {
            typeMap[type].warning++;
            typeMap[type].totalRisk += 55;
          } else {
            typeMap[type].healthy++;
            typeMap[type].totalRisk += 10;
          }
        });
        
        // Convert to array and calculate avg risk
        const typeArray = Object.values(typeMap).map(t => ({
          ...t,
          avgRisk: Math.round(t.totalRisk / t.count)
        }));
        
        // Sort by count (most common first)
        typeArray.sort((a, b) => b.count - a.count);
        
        setTypeData(typeArray);
      } catch (error) {
        console.error('Error fetching equipment by type:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEquipmentByType();
  }, []);

  if (loading) {
    return (
      <Card className="border-0 bg-white shadow-lg">
        <CardContent className="py-4">
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white shadow-lg">
      <CardHeader className="py-2 px-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800 text-sm">
            <Cpu className="h-4 w-4 text-blue-500" />
            Assets by Type
          </CardTitle>
          <span className="text-xs text-gray-500">
            {totalEquipment} total
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {typeData.map((item) => {
            const Icon = TYPE_ICONS[item.type] || TYPE_ICONS.default;
            const displayName = TYPE_NAMES[item.type] || item.type.replace(/_/g, ' ');
            
            // Determine card color based on risk
            const hasIssues = item.critical > 0 || item.warning > 0;
            const cardBg = item.critical > 0 
              ? 'bg-red-50 border-red-200' 
              : item.warning > 0 
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200';
            
            return (
              <div 
                key={item.type}
                className={`rounded-lg border p-2.5 ${cardBg} transition-all hover:shadow-md cursor-default`}
              >
                {/* Header: Icon + Name */}
                <div className="flex items-start gap-2 mb-2">
                  <div className={`p-1.5 rounded-md ${
                    item.critical > 0 ? 'bg-red-100' : 
                    item.warning > 0 ? 'bg-amber-100' : 'bg-emerald-100'
                  }`}>
                    <Icon className={`h-3.5 w-3.5 ${
                      item.critical > 0 ? 'text-red-600' : 
                      item.warning > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-gray-700 truncate leading-tight">
                      {displayName}
                    </p>
                    <p className="text-lg font-bold text-gray-900 leading-none mt-0.5">
                      {item.count}
                    </p>
                  </div>
                </div>
                
                {/* Status breakdown */}
                <div className="flex items-center gap-1.5 text-[9px]">
                  {item.critical > 0 && (
                    <span className="flex items-center gap-0.5 text-red-600 font-medium">
                      <XCircle className="h-2.5 w-2.5" />
                      {item.critical}
                    </span>
                  )}
                  {item.warning > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {item.warning}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                    <CheckCircle className="h-2.5 w-2.5" />
                    {item.healthy}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default EquipmentTypeSummary;
