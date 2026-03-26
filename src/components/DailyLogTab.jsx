import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Calendar,
  Clock,
  User,
  Camera,
  Thermometer,
  Zap,
  ZapOff,
  FileText,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Plus,
  Filter,
  TrendingUp,
  Activity,
  Settings,
} from 'lucide-react';
import { dailyLogAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { format, parseISO, subDays } from 'date-fns';
import DailyLogTemplateConfig from './DailyLogTemplateConfig';

const DailyLogTab = ({ assetId, assetType, companyId }) => {
  const { currentUser, isAdmin, isMaster } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);
  const [dateFilter, setDateFilter] = useState('7d');
  const [viewMode, setViewMode] = useState('timeline'); // timeline, calendar, photos
  const [showTemplateConfig, setShowTemplateConfig] = useState(false);

  useEffect(() => {
    if (assetId) {
      loadLogs();
      loadStats();
    }
  }, [assetId, dateFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : dateFilter === '90d' ? 90 : 365;
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      
      const response = await dailyLogAPI.getAssetLogs(assetId, startDate);
      setLogs(response.logs || []);
    } catch (error) {
      console.error('Failed to load daily logs:', error);
      toast.error('Failed to load daily logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : dateFilter === '90d' ? 90 : 365;
      const response = await dailyLogAPI.getStats(assetId, days);
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'energized':
        return <Zap className="w-4 h-4 text-green-500" />;
      case 'de-energized':
        return <ZapOff className="w-4 h-4 text-red-500" />;
      case 'under maintenance':
        return <Activity className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'energized':
        return 'default';
      case 'de-energized':
        return 'destructive';
      case 'under maintenance':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getReadingStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  // Group logs by date
  const logsByDate = logs.reduce((acc, log) => {
    const date = log.log_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {});

  // Get all photos from logs
  const allPhotos = logs.flatMap(log => 
    (log.photos || []).map(photo => ({
      ...photo,
      log_date: log.log_date,
      log_time: log.log_time,
      logged_by: log.logged_by_name
    }))
  );

  const renderTimelineView = () => (
    <div className="space-y-4">
      {Object.entries(logsByDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dateLogs]) => (
          <Card key={date} className="overflow-hidden">
            <CardHeader 
              className="py-3 px-4 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => setSelectedDate(selectedDate === date ? null : date)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                  </span>
                  <Badge variant="outline" className="ml-2">
                    {dateLogs.length} {dateLogs.length === 1 ? 'entry' : 'entries'}
                  </Badge>
                </div>
                {selectedDate === date ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </CardHeader>
            
            {selectedDate === date && (
              <CardContent className="p-0">
                <div className="divide-y">
                  {dateLogs
                    .sort((a, b) => b.log_time.localeCompare(a.log_time))
                    .map((log) => (
                      <div 
                        key={log.log_id}
                        className="p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span className="font-mono">{log.log_time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{log.logged_by_name}</span>
                            </div>
                            {log.shift && (
                              <Badge variant="outline" className="text-xs">
                                {log.shift}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.operational_status)}
                            <Badge variant={getStatusBadgeVariant(log.operational_status)}>
                              {log.operational_status}
                            </Badge>
                          </div>
                        </div>

                        {/* Status Change Indicator */}
                        {log.previous_status && log.previous_status !== log.operational_status && (
                          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm">
                            <span className="font-medium text-amber-700">Status Changed: </span>
                            <span className="text-amber-600">
                              {log.previous_status} → {log.operational_status}
                            </span>
                            {log.status_change_reason && (
                              <span className="text-amber-600 ml-2">
                                ({log.status_change_reason})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Readings Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                          {(log.readings || [])
                            .filter(r => r.param_type !== 'text' && r.param_type !== 'photo')
                            .map((reading, idx) => (
                              <div 
                                key={idx}
                                className={`p-2 rounded-md border ${getReadingStatusColor(reading.status)}`}
                              >
                                <div className="text-xs text-muted-foreground truncate">
                                  {reading.param_name}
                                </div>
                                <div className="font-semibold flex items-center gap-1">
                                  {reading.param_type === 'checkbox' ? (
                                    reading.value ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    )
                                  ) : (
                                    <>
                                      {reading.value}
                                      {reading.unit && (
                                        <span className="text-xs text-muted-foreground">
                                          {reading.unit}
                                        </span>
                                      )}
                                    </>
                                  )}
                                  {reading.captured_via_ocr && (
                                    <Badge variant="outline" className="text-[10px] ml-1 px-1">
                                      OCR
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>

                        {/* Notes */}
                        {log.notes && (
                          <div className="p-2 bg-muted/50 rounded-md text-sm mb-3">
                            <span className="font-medium">Notes: </span>
                            {log.notes}
                          </div>
                        )}

                        {/* Photos */}
                        {log.photos && log.photos.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {log.photos.map((photo, idx) => (
                              <div 
                                key={idx}
                                className="relative w-16 h-16 rounded-md overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary"
                                onClick={() => window.open(photo.url || photo.base64, '_blank')}
                              >
                                <img 
                                  src={photo.url || photo.base64} 
                                  alt={photo.description || 'Log photo'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      
      {Object.keys(logsByDate).length === 0 && !loading && (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No daily logs found for this period</p>
          <p className="text-sm text-muted-foreground mt-1">
            Use the "Daily Log" button to record readings
          </p>
        </Card>
      )}
    </div>
  );

  const renderPhotosView = () => (
    <div className="space-y-4">
      {allPhotos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allPhotos.map((photo, idx) => (
            <Card 
              key={idx}
              className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => window.open(photo.url || photo.base64, '_blank')}
            >
              <div className="aspect-square relative">
                <img 
                  src={photo.url || photo.base64}
                  alt={photo.description || 'Log photo'}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-2">
                <div className="text-xs text-muted-foreground">
                  {format(parseISO(photo.log_date), 'MMM d, yyyy')} at {photo.log_time}
                </div>
                <div className="text-xs truncate">{photo.logged_by}</div>
                {photo.description && (
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {photo.description}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No photos captured yet</p>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-4" data-testid="daily-log-tab">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
              Total Logs
            </div>
            <div className="text-2xl font-bold">{stats.total_logs}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              Days Logged
            </div>
            <div className="text-2xl font-bold">{stats.unique_days_logged}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              Coverage
            </div>
            <div className="text-2xl font-bold">{stats.coverage_percentage}%</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Camera className="w-4 h-4" />
              Photos
            </div>
            <div className="text-2xl font-bold">{allPhotos.length}</div>
          </Card>
        </div>
      )}

      {/* Filters and View Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1">
            {['7d', '30d', '90d', '1y'].map((filter) => (
              <Button
                key={filter}
                variant={dateFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter(filter)}
              >
                {filter === '1y' ? '1 Year' : filter}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Admin Configure Button */}
          {(isAdmin || isMaster) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateConfig(true)}
              className="gap-1"
              data-testid="configure-template-btn"
            >
              <Settings className="w-4 h-4" />
              Configure Template
            </Button>
          )}
          
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
            <TabsList>
              <TabsTrigger value="timeline" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="photos" className="text-xs">
                <Camera className="w-3 h-3 mr-1" />
                Photos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading daily logs...</p>
        </Card>
      ) : viewMode === 'timeline' ? (
        renderTimelineView()
      ) : (
        renderPhotosView()
      )}

      {/* Template Configuration Modal (Admin Only) */}
      <DailyLogTemplateConfig
        open={showTemplateConfig}
        onClose={() => setShowTemplateConfig(false)}
        assetType={assetType}
        companyId={companyId}
        onSave={() => {
          setShowTemplateConfig(false);
          toast.success('Template updated. New logs will use the updated parameters.');
        }}
      />
    </div>
  );
};

export default DailyLogTab;
