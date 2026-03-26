/**
 * Alarm List Widget
 * Displays active alarms with severity indicators
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { 
  AlertTriangle, 
  CheckCircle,
  MapPin
} from 'lucide-react';

export function AlarmListWidget({ data, alarms = [], config = {} }) {
  const navigate = useNavigate();
  const limit = config.limit || 5;
  const showViewAll = config.show_view_all !== false;

  return (
    <Card className="border-0 bg-white shadow-lg h-full">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Active Alarms
            </CardTitle>
            <CardDescription className="text-gray-500">{alarms.length} alarms require attention</CardDescription>
          </div>
          {showViewAll && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/monitoring/alarms')}
              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {alarms.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-gray-800 font-medium">No active alarms</p>
            <p className="text-xs text-gray-500 mt-1">All systems operating normally</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {alarms.slice(0, limit).map((alarm) => (
              <div 
                key={alarm.alarm_id}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
                  alarm.severity === 'critical' 
                    ? 'bg-red-50 border-red-200 hover:border-red-300' 
                    : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                }`}
                onClick={() => navigate(`/monitoring/equipment/${alarm.equipment_id}`)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span 
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                      alarm.severity === 'critical' 
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {alarm.severity}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(alarm.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">{alarm.equipment_name}</p>
                <p className="text-xs text-gray-600 truncate mt-0.5">{alarm.message}</p>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {alarm.substation_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AlarmListWidget;
