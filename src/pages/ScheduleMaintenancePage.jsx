import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Calendar } from '../components/ui/calendar';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { DMSLogo } from '../components/DMSLogo';
import { PageNavigation } from '../components/PageNavigation';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { useAPIData, useAPIDataWithRefetch } from '../hooks/useAPI';
import { assetsAPI, maintenanceAPI } from '../services/api';
import { 
  Activity,
  Wrench,
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  FileText,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';

export const ScheduleMaintenancePage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { assetType, assetId } = useParams();

  // Fetch asset data from API
  const { data: asset, loading: assetLoading, error: assetError } = useAPIData(
    () => assetsAPI.getById(assetId),
    [assetId]
  );

  // Fetch maintenance schedules from API with refetch capability
  const { data: maintenanceSchedules, loading: maintenanceLoading, error: maintenanceError, refetch } = useAPIDataWithRefetch(
    () => maintenanceAPI.getAll({ asset_id: assetId }),
    [assetId]
  );

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    maintenanceType: '',
    priority: '',
    timeSlot: '',
    duration: '',
    technician: '',
    description: '',
    specialRequirements: ''
  });

  const assetTypeNames = {
    transformer: 'Transformer',
    switchgear: 'Switch Gear',
    motors: 'Motors',
    generators: 'Generators',
    cables: 'Cables',
    ups: 'UPS'
  };

  // Filter upcoming maintenance (scheduled or pending status)
  const upcomingMaintenance = maintenanceSchedules?.filter(
    schedule => schedule.status === 'scheduled' || schedule.status === 'pending'
  ) || [];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.maintenanceType || !formData.priority || !formData.timeSlot || !formData.duration || !formData.technician) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create maintenance schedule via API
      await maintenanceAPI.create({
        asset_id: assetId,
        site_id: asset.site_id,
        maintenance_type: formData.maintenanceType,
        priority: formData.priority,
        scheduled_date: selectedDate.toISOString().split('T')[0],
        scheduled_time: formData.timeSlot,
        estimated_duration: formData.duration,
        assigned_technician: formData.technician,
        description: formData.description,
        special_requirements: formData.specialRequirements,
        status: 'scheduled'
      });

      toast.success('Maintenance scheduled successfully!');
      
      // Refetch maintenance schedules to show the new one
      refetch();
      
      // Reset form
      setFormData({
        maintenanceType: '',
        priority: '',
        timeSlot: '',
        duration: '',
        technician: '',
        description: '',
        specialRequirements: ''
      });
    } catch (error) {
      toast.error('Failed to schedule maintenance: ' + error.message);
    }
    
    // Reset form and navigate back after a delay
    setTimeout(() => {
      navigate(`/assets/${assetType}/${assetId}`);
    }, 2000);
  };

  // Show loading state
  if (assetLoading || maintenanceLoading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner size="lg" text="Loading maintenance schedules..." />
      </div>
    );
  }

  // Show error state
  if (assetError || maintenanceError) {
    return (
      <div className="min-h-screen">
        <ErrorMessage error={assetError || maintenanceError} retry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Mobile Layout */}
          <div className="flex md:hidden flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-sm font-bold text-foreground">Maintenance</h1>
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">{asset?.asset_name || 'Asset'}</p>
              </div>
              <div className="flex items-center gap-3">
                <DMSLogo size="sm" />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={onLogout}
                  className="transition-smooth hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Activity className="w-5 h-5 text-primary animate-pulse" strokeWidth={2.5} />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                DMS Insight<sup className="text-xs text-primary">™</sup>
              </h1>
            </div>
            {/* Navigation */}
            <PageNavigation 
              showAssetActionsSelector={true}
              currentAssetType={assetType}
              currentAssetId={assetId}
              breadcrumbs={[
                { label: 'Asset Dashboard', link: '/dashboard' },
                { label: assetTypeNames[assetType], link: `/assets/${assetType}` },
                { label: asset?.asset_name || 'Asset', link: `/assets/${assetType}/${assetId}` },
                { label: 'Schedule Maintenance', link: null }
              ]}
            />
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <DMSLogo size="sm" />
                  <p className="text-[10px] font-semibold text-primary tracking-wider mt-1">FROM DATA TO DECISIONS</p>
                </div>
                <div className="border-l border-border h-8 mx-2" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Schedule Maintenance</h1>
                  <p className="text-xs text-muted-foreground">{asset?.assetName || 'Asset'}</p>
                </div>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                <Activity className="w-7 h-7 text-primary animate-pulse" strokeWidth={2.5} />
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent drop-shadow-sm tracking-tight">
                    DMS Insight<sup className="text-base ml-0.5 text-primary">™</sup>
                  </h1>
                  <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 rounded-full mt-1"></div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={onLogout}
                className="transition-smooth hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
            {/* Navigation */}
            <PageNavigation 
              showAssetActionsSelector={true}
              currentAssetType={assetType}
              currentAssetId={assetId}
              breadcrumbs={[
                { label: 'Asset Dashboard', link: '/dashboard' },
                { label: assetTypeNames[assetType], link: `/assets/${assetType}` },
                { label: asset?.asset_name || 'Asset', link: `/assets/${assetType}/${assetId}` },
                { label: 'Schedule Maintenance', link: null }
              ]}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Schedule New Maintenance</h2>
          <p className="text-lg text-muted-foreground">
            Plan and schedule maintenance activities for {asset?.assetName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Maintenance Details Form */}
            <Card className="border-border/50 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2 text-primary" />
                  Maintenance Details
                </CardTitle>
                <CardDescription>
                  Provide information about the scheduled maintenance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Maintenance Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceType">
                        Maintenance Type <span className="text-destructive">*</span>
                      </Label>
                      <Select 
                        value={formData.maintenanceType}
                        onValueChange={(value) => handleInputChange('maintenanceType', value)}
                      >
                        <SelectTrigger id="maintenanceType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="preventive">Preventive Maintenance</SelectItem>
                          <SelectItem value="corrective">Corrective Maintenance</SelectItem>
                          <SelectItem value="inspection">Routine Inspection</SelectItem>
                          <SelectItem value="testing">Testing & Diagnostics</SelectItem>
                          <SelectItem value="calibration">Calibration</SelectItem>
                          <SelectItem value="emergency">Emergency Repair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">
                        Priority <span className="text-destructive">*</span>
                      </Label>
                      <Select 
                        value={formData.priority}
                        onValueChange={(value) => handleInputChange('priority', value)}
                      >
                        <SelectTrigger id="priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Time and Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeSlot">
                        Time Slot <span className="text-destructive">*</span>
                      </Label>
                      <Select 
                        value={formData.timeSlot}
                        onValueChange={(value) => handleInputChange('timeSlot', value)}
                      >
                        <SelectTrigger id="timeSlot">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="08:00-10:00">08:00 AM - 10:00 AM</SelectItem>
                          <SelectItem value="10:00-12:00">10:00 AM - 12:00 PM</SelectItem>
                          <SelectItem value="12:00-14:00">12:00 PM - 02:00 PM</SelectItem>
                          <SelectItem value="14:00-16:00">02:00 PM - 04:00 PM</SelectItem>
                          <SelectItem value="16:00-18:00">04:00 PM - 06:00 PM</SelectItem>
                          <SelectItem value="18:00-20:00">06:00 PM - 08:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">
                        Estimated Duration <span className="text-destructive">*</span>
                      </Label>
                      <Select 
                        value={formData.duration}
                        onValueChange={(value) => handleInputChange('duration', value)}
                      >
                        <SelectTrigger id="duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="2">2 hours</SelectItem>
                          <SelectItem value="3">3 hours</SelectItem>
                          <SelectItem value="4">4 hours</SelectItem>
                          <SelectItem value="6">6 hours</SelectItem>
                          <SelectItem value="8">8 hours (Full day)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Technician Assignment */}
                  <div className="space-y-2">
                    <Label htmlFor="technician">
                      Assign Technician <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={formData.technician}
                      onValueChange={(value) => handleInputChange('technician', value)}
                    >
                      <SelectTrigger id="technician">
                        <SelectValue placeholder="Select technician" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="john-smith">John Smith (Senior Technician)</SelectItem>
                        <SelectItem value="sarah-johnson">Sarah Johnson (Lead Engineer)</SelectItem>
                        <SelectItem value="mike-davis">Mike Davis (Maintenance Specialist)</SelectItem>
                        <SelectItem value="emma-wilson">Emma Wilson (Field Technician)</SelectItem>
                        <SelectItem value="david-brown">David Brown (Senior Engineer)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Work Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the maintenance work to be performed..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Special Requirements */}
                  <div className="space-y-2">
                    <Label htmlFor="specialRequirements">
                      Special Requirements / Notes
                    </Label>
                    <Textarea
                      id="specialRequirements"
                      placeholder="Any special tools, parts, or safety requirements..."
                      value={formData.specialRequirements}
                      onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <Separator />

                  {/* Submit Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/assets/${assetType}/${assetId}`)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary-dark transition-smooth"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Schedule Maintenance
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card className="border-border/50 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2 text-secondary" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  disabled={(date) => date < new Date()}
                />
              </CardContent>
            </Card>

            {/* Asset Info */}
            <Card className="border-border/50 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Asset Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Asset Name</p>
                  <p className="font-semibold">{asset?.assetName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Asset ID</p>
                  <p className="font-mono text-sm">{asset?.assetId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Type</p>
                  <p className="font-semibold">{assetTypeNames[assetType]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Health Score</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-primary">{asset?.health_score}/100</span>
                    {asset?.health_score >= 80 ? (
                      <Badge className="bg-[hsl(var(--status-healthy))] text-[hsl(var(--status-healthy-foreground))]">
                        Healthy
                      </Badge>
                    ) : asset?.health_score >= 60 ? (
                      <Badge className="bg-[hsl(var(--status-warning))] text-[hsl(var(--status-warning-foreground))]">
                        Warning
                      </Badge>
                    ) : (
                      <Badge className="bg-[hsl(var(--status-critical))] text-[hsl(var(--status-critical-foreground))]">
                        Critical
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Maintenance */}
            <Card className="border-border/50 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-accent" />
                  Upcoming Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingMaintenance.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming maintenance scheduled</p>
                  ) : (
                    upcomingMaintenance.map((maintenance, index) => (
                      <div key={maintenance.schedule_id || index} className="p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-smooth">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm">{maintenance.maintenance_type}</p>
                          <Badge variant="outline" className="border-primary text-primary text-xs">
                            {maintenance.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mb-1">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {maintenance.scheduled_date} at {maintenance.scheduled_time}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="w-3 h-3 mr-1" />
                          {maintenance.assigned_technician}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
