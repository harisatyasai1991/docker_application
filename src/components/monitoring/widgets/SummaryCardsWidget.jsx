/**
 * Summary Cards Widget
 * Displays KPI cards with key metrics
 */
import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { 
  Building2, 
  Cpu, 
  XCircle, 
  Shield,
  AlertTriangle,
  MapPin,
  Clock
} from 'lucide-react';

export function SummaryCardsWidget({ data, config = {} }) {
  const health = data?.health_summary || {};
  const alarms = data?.alarm_summary || {};
  const isCompact = config.compact === true;
  
  const healthyPercent = data?.total_equipment > 0 
    ? Math.round((health.healthy / data.total_equipment) * 100) 
    : 0;

  // Default 4 cards: Substations, Equipment, Critical Alarms, Health
  const defaultCards = ['substations', 'equipment', 'critical_alarms', 'health'];
  const cardsToShow = config.cards || defaultCards;

  const renderCard = (cardType) => {
    switch (cardType) {
      case 'substations':
        return (
          <Card key="substations" className={`border-0 bg-white shadow-md hover:shadow-lg transition-all duration-300 ${isCompact ? 'shadow-blue-50' : 'shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-100'}`}>
            <CardContent className={isCompact ? 'pt-4 pb-3 px-4' : 'pt-6'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium text-gray-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>Substations</p>
                  <p className={`font-bold text-gray-800 ${isCompact ? 'text-2xl mt-0.5' : 'text-4xl mt-1'}`}>{data?.total_substations || 0}</p>
                </div>
                <div className={`rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 ${isCompact ? 'h-10 w-10' : 'h-14 w-14 rounded-2xl'}`}>
                  <Building2 className={`text-white ${isCompact ? 'h-5 w-5' : 'h-7 w-7'}`} />
                </div>
              </div>
              {!isCompact && (
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-blue-500" />
                  Across 4 SEC regions
                </p>
              )}
            </CardContent>
          </Card>
        );
        
      case 'equipment':
        return (
          <Card key="equipment" className={`border-0 bg-white shadow-md hover:shadow-lg transition-all duration-300 ${isCompact ? 'shadow-cyan-50' : 'shadow-lg shadow-cyan-100/50 hover:shadow-xl hover:shadow-cyan-100'}`}>
            <CardContent className={isCompact ? 'pt-4 pb-3 px-4' : 'pt-6'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium text-gray-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>Monitored Assets</p>
                  <p className={`font-bold text-gray-800 ${isCompact ? 'text-2xl mt-0.5' : 'text-4xl mt-1'}`}>{data?.total_equipment || 0}</p>
                </div>
                <div className={`rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-200 ${isCompact ? 'h-10 w-10' : 'h-14 w-14 rounded-2xl'}`}>
                  <Cpu className={`text-white ${isCompact ? 'h-5 w-5' : 'h-7 w-7'}`} />
                </div>
              </div>
              <div className={`flex items-center gap-2 ${isCompact ? 'mt-2' : 'mt-3'}`}>
                <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${isCompact ? 'h-1.5' : 'h-2.5'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${healthyPercent}%` }}
                  ></div>
                </div>
                <span className={`font-semibold text-emerald-600 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>{healthyPercent}%</span>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'critical_alarms':
        return (
          <Card key="critical" className={`border-0 bg-white shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden ${isCompact ? 'shadow-red-50' : 'shadow-lg shadow-red-100/50 hover:shadow-xl hover:shadow-red-100'}`}>
            {(alarms.critical || 0) > 0 && (
              <div className={`absolute bg-red-500 rounded-full animate-pulse ${isCompact ? 'top-2 right-2 h-2 w-2' : 'top-3 right-3 h-3 w-3'}`}></div>
            )}
            <CardContent className={isCompact ? 'pt-4 pb-3 px-4' : 'pt-6'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium text-gray-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>Critical Alarms</p>
                  <p className={`font-bold text-red-500 ${isCompact ? 'text-2xl mt-0.5' : 'text-4xl mt-1'}`}>{alarms.critical || 0}</p>
                </div>
                <div className={`rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-200 ${isCompact ? 'h-10 w-10' : 'h-14 w-14 rounded-2xl'}`}>
                  <XCircle className={`text-white ${isCompact ? 'h-5 w-5' : 'h-7 w-7'}`} />
                </div>
              </div>
              {!isCompact && (
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  {alarms.warning || 0} warnings active
                </p>
              )}
            </CardContent>
          </Card>
        );
        
      case 'health':
        return (
          <Card key="health" className={`border-0 bg-white shadow-md hover:shadow-lg transition-all duration-300 ${isCompact ? 'shadow-emerald-50' : 'shadow-lg shadow-emerald-100/50 hover:shadow-xl hover:shadow-emerald-100'}`}>
            <CardContent className={isCompact ? 'pt-4 pb-3 px-4' : 'pt-6'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium text-gray-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>Asset Health</p>
                  <div className={`flex items-center gap-1.5 ${isCompact ? 'mt-1' : 'mt-2'}`}>
                    <span className={`font-bold text-emerald-500 ${isCompact ? 'text-lg' : 'text-2xl'}`}>{health.healthy || 0}</span>
                    <span className="text-gray-300">/</span>
                    <span className={`font-bold text-amber-500 ${isCompact ? 'text-lg' : 'text-2xl'}`}>{health.warning || 0}</span>
                    <span className="text-gray-300">/</span>
                    <span className={`font-bold text-red-500 ${isCompact ? 'text-lg' : 'text-2xl'}`}>{health.critical || 0}</span>
                  </div>
                </div>
                <div className={`rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-200 ${isCompact ? 'h-10 w-10' : 'h-14 w-14 rounded-2xl'}`}>
                  <Shield className={`text-white ${isCompact ? 'h-5 w-5' : 'h-7 w-7'}`} />
                </div>
              </div>
              {!isCompact && (
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Healthy</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Warning</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Critical</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`grid gap-4 ${config.compact 
      ? 'grid-cols-2 md:grid-cols-4' 
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'}`}>
      {cardsToShow.map(cardType => renderCard(cardType))}
    </div>
  );
}

export default SummaryCardsWidget;
