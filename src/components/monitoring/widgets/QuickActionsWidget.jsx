/**
 * Quick Actions Widget
 * Displays navigation shortcuts for common actions
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { 
  Building2, 
  AlertTriangle, 
  TrendingUp,
  Zap
} from 'lucide-react';

export function QuickActionsWidget({ config = {} }) {
  const navigate = useNavigate();

  // Default actions or from config
  const defaultActions = [
    { 
      id: 'substations', 
      label: 'View Substations', 
      icon: Building2, 
      path: '/monitoring/substations',
      gradient: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200 hover:border-blue-400',
      iconColor: 'text-blue-600',
      shadow: 'hover:shadow-blue-100'
    },
    { 
      id: 'critical', 
      label: 'Critical Assets', 
      icon: AlertTriangle, 
      path: '/monitoring/equipment?health_status=critical',
      gradient: 'from-red-50 to-orange-50',
      border: 'border-red-200 hover:border-red-400',
      iconColor: 'text-red-600',
      shadow: 'hover:shadow-red-100'
    },
    { 
      id: 'alarms', 
      label: 'Manage Alarms', 
      icon: AlertTriangle, 
      path: '/monitoring/alarms?status=active',
      gradient: 'from-amber-50 to-yellow-50',
      border: 'border-amber-200 hover:border-amber-400',
      iconColor: 'text-amber-600',
      shadow: 'hover:shadow-amber-100'
    },
    { 
      id: 'analytics', 
      label: 'View Analytics', 
      icon: TrendingUp, 
      path: '/monitoring/analytics',
      gradient: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200 hover:border-emerald-400',
      iconColor: 'text-emerald-600',
      shadow: 'hover:shadow-emerald-100'
    }
  ];

  const actions = config.actions || defaultActions;

  return (
    <Card className="border-0 bg-white shadow-lg">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Zap className="h-5 w-5 text-blue-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon || Zap;
            return (
              <Button 
                key={action.id}
                variant="outline" 
                className={`h-24 flex-col gap-3 bg-gradient-to-br ${action.gradient} border-2 ${action.border} hover:bg-opacity-90 hover:shadow-lg ${action.shadow} transition-all duration-300`}
                onClick={() => navigate(action.path)}
              >
                <Icon className={`h-7 w-7 ${action.iconColor}`} />
                <span className="text-gray-700 font-medium text-sm">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActionsWidget;
