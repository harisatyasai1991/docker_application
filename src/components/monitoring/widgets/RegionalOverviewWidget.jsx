/**
 * Regional Overview Widget
 * Displays regional cards with substations, equipment counts and status
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { 
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const REGION_COLORS = {
  central: { 
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    hover: 'hover:border-blue-400 hover:shadow-blue-100'
  },
  eastern: { 
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    hover: 'hover:border-emerald-400 hover:shadow-emerald-100'
  },
  southern: { 
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    hover: 'hover:border-orange-400 hover:shadow-orange-100'
  },
  western: { 
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    hover: 'hover:border-purple-400 hover:shadow-purple-100'
  }
};

const REGION_NAMES = {
  central: 'Central Region',
  eastern: 'Eastern Region',
  southern: 'Southern Region',
  western: 'Western Region'
};

export function RegionalOverviewWidget({ data, config = {} }) {
  const navigate = useNavigate();
  const regions = data?.regions || [];
  const showMapLink = config.show_map_link !== false;

  return (
    <Card className="border-0 bg-white shadow-lg h-full">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <MapPin className="h-5 w-5 text-blue-500" />
              Regional Overview
            </CardTitle>
            <CardDescription className="text-gray-500">SEC regions monitoring status</CardDescription>
          </div>
          {showMapLink && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/monitoring/map')}
              className="gap-2 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300"
            >
              View Map
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regions.map((region) => {
            const colors = REGION_COLORS[region.region] || REGION_COLORS.central;
            const hasIssues = region.critical_count > 0 || region.warning_count > 0;
            
            return (
              <div 
                key={region.region}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-lg ${colors.bg} ${colors.border} ${colors.hover}`}
                onClick={() => navigate(`/monitoring/substations?region=${region.region}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${colors.text}`}>
                    {REGION_NAMES[region.region] || region.region_name}
                  </h3>
                  {hasIssues ? (
                    <div className="flex items-center gap-1">
                      {region.critical_count > 0 && (
                        <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                  ) : (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/80 rounded-lg p-2.5 text-center shadow-sm">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Substations</p>
                    <p className="text-xl font-bold text-gray-800">{region.substation_count}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2.5 text-center shadow-sm">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Assets</p>
                    <p className="text-xl font-bold text-gray-800">{region.equipment_count}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2.5 text-center shadow-sm">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Alarms</p>
                    <p className={`text-xl font-bold ${region.critical_count > 0 ? 'text-red-500' : region.warning_count > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {region.alarm_count || 0}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default RegionalOverviewWidget;
