import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  MousePointer, 
  Save, 
  Upload,
  Settings,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  RefreshCw,
  Maximize2,
  Grid3X3,
  Layers
} from 'lucide-react';
import { sitesAPI, assetsAPI } from '../services/api';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export const SingleLineDiagramPage = ({ onLogout }) => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isMaster } = useAuth();
  const canManage = isAdmin() || isMaster();
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  
  // State
  const [site, setSite] = useState(null);
  const [assets, setAssets] = useState([]);
  const [sldData, setSldData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manageMode, setManageMode] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAddMarkerDialog, setShowAddMarkerDialog] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState(null);
  const [selectedAssetForMarker, setSelectedAssetForMarker] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Asset markers on the diagram
  const [markers, setMarkers] = useState([]);

  // Load site and assets
  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load site details
      const siteData = await sitesAPI.getById(siteId);
      setSite(siteData);
      
      // Load assets for this site
      const assetsData = await assetsAPI.getAll({ site_id: siteId });
      setAssets(assetsData || []);
      
      // Load SLD data (image and marker positions)
      try {
        const response = await fetch(`${API_BASE}/api/sites/${siteId}/sld`, {
          headers: {
            'x-user-role': 'master',
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSldData(data);
          setMarkers(data.markers || []);
        }
      } catch (err) {
        console.log('No SLD data yet');
      }
    } catch (error) {
      toast.error('Failed to load site data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE}/api/sites/${siteId}/sld/upload`, {
        method: 'POST',
        headers: {
          'x-user-role': 'master',
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setSldData(prev => ({ ...prev, image_url: data.image_url }));
      toast.success('SLD image uploaded successfully');
      setShowUploadDialog(false);
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle clicking on diagram to add marker
  const handleDiagramClick = (e) => {
    if (!manageMode || !sldData?.image_url) return;
    
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setNewMarkerPosition({ x, y });
    setShowAddMarkerDialog(true);
  };

  // Add marker for asset
  const handleAddMarker = async () => {
    if (!selectedAssetForMarker || !newMarkerPosition) return;
    
    const asset = assets.find(a => a.asset_id === selectedAssetForMarker);
    if (!asset) return;
    
    const newMarker = {
      id: `marker-${Date.now()}`,
      asset_id: asset.asset_id,
      asset_name: asset.asset_name,
      asset_type: asset.asset_type,
      x: newMarkerPosition.x,
      y: newMarkerPosition.y,
      status: asset.status || 'normal'
    };
    
    const updatedMarkers = [...markers, newMarker];
    setMarkers(updatedMarkers);
    await saveMarkers(updatedMarkers);
    
    setShowAddMarkerDialog(false);
    setNewMarkerPosition(null);
    setSelectedAssetForMarker('');
    toast.success(`Added ${asset.asset_name} to diagram`);
  };

  // Save markers to backend
  const saveMarkers = async (markersToSave) => {
    try {
      await fetch(`${API_BASE}/api/sites/${siteId}/sld/markers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'master',
        },
        body: JSON.stringify({ markers: markersToSave })
      });
    } catch (error) {
      console.error('Failed to save markers:', error);
    }
  };

  // Delete marker
  const handleDeleteMarker = async (markerId) => {
    const updatedMarkers = markers.filter(m => m.id !== markerId);
    setMarkers(updatedMarkers);
    await saveMarkers(updatedMarkers);
    toast.success('Marker removed');
  };

  // Navigate to asset detail
  const handleMarkerClick = (marker) => {
    if (manageMode) {
      setSelectedAsset(marker);
    } else {
      // Navigate to asset detail page (requires asset_type in the route)
      navigate(`/assets/${marker.asset_type}/${marker.asset_id}`);
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Get marker color based on status
  const getMarkerColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-500 border-red-600 shadow-red-500/50';
      case 'warning': return 'bg-amber-500 border-amber-600 shadow-amber-500/50';
      case 'normal': return 'bg-green-500 border-green-600 shadow-green-500/50';
      default: return 'bg-blue-500 border-blue-600 shadow-blue-500/50';
    }
  };

  // Get icon for asset type
  const getAssetIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'transformer':
        return <Zap className="w-3 h-3" />;
      case 'circuit_breaker':
        return <Activity className="w-3 h-3" />;
      default:
        return <Grid3X3 className="w-3 h-3" />;
    }
  };

  // Assets not yet on diagram
  const unmappedAssets = assets.filter(
    asset => !markers.some(m => m.asset_id === asset.asset_id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader onLogout={onLogout} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Single Line Diagram
                </h1>
                <p className="text-sm text-muted-foreground">{site?.site_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResetView}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
              
              {canManage && (
                <>
                  <Button
                    variant={manageMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setManageMode(!manageMode)}
                    data-testid="manage-sld-btn"
                  >
                    {manageMode ? <Eye className="w-4 h-4 mr-2" /> : <Settings className="w-4 h-4 mr-2" />}
                    {manageMode ? 'View Mode' : 'Manage SLD'}
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload SLD
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* SLD Viewer */}
          <div className="col-span-12 lg:col-span-9">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {sldData?.image_url ? (
                  <div 
                    ref={containerRef}
                    className="relative bg-slate-900 overflow-hidden"
                    style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
                  >
                    {/* Diagram Image with Markers */}
                    <div
                      className="relative w-full h-full flex items-center justify-center"
                      style={{
                        transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                      }}
                    >
                      <div className="relative">
                        <img
                          ref={imageRef}
                          src={sldData.image_url.startsWith('http') ? sldData.image_url : `${API_BASE}${sldData.image_url}`}
                          alt="Single Line Diagram"
                          className="max-w-full max-h-full object-contain"
                          onClick={handleDiagramClick}
                          style={{ cursor: manageMode ? 'crosshair' : 'default' }}
                        />
                        
                        {/* Asset Markers */}
                        <TooltipProvider>
                          {markers.map((marker) => (
                            <Tooltip key={marker.id}>
                              <TooltipTrigger asChild>
                                <button
                                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 
                                    w-8 h-8 rounded-full border-2 flex items-center justify-center
                                    transition-all duration-200 hover:scale-125 cursor-pointer
                                    shadow-lg ${getMarkerColor(marker.status)}
                                    ${hoveredMarker === marker.id ? 'scale-125 ring-2 ring-white' : ''}
                                    ${selectedAsset?.id === marker.id ? 'ring-4 ring-primary' : ''}`}
                                  style={{
                                    left: `${marker.x}%`,
                                    top: `${marker.y}%`,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkerClick(marker);
                                  }}
                                  onMouseEnter={() => setHoveredMarker(marker.id)}
                                  onMouseLeave={() => setHoveredMarker(null)}
                                >
                                  <span className="text-white">
                                    {getAssetIcon(marker.asset_type)}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-slate-900 border-slate-700">
                                <div className="text-center">
                                  <p className="font-semibold">{marker.asset_name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{marker.asset_type?.replace('_', ' ')}</p>
                                  <Badge 
                                    variant="outline" 
                                    className={`mt-1 text-xs ${
                                      marker.status === 'critical' ? 'border-red-500 text-red-500' :
                                      marker.status === 'warning' ? 'border-amber-500 text-amber-500' :
                                      'border-green-500 text-green-500'
                                    }`}
                                  >
                                    {marker.status || 'Normal'}
                                  </Badge>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    {/* Manage Mode Indicator */}
                    {manageMode && (
                      <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Manage Mode - Click on diagram to place assets
                      </div>
                    )}
                    
                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
                      <p className="text-xs text-slate-400 mb-2 font-medium">Status Legend</p>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-xs text-slate-300">Normal</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          <span className="text-xs text-slate-300">Warning</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-xs text-slate-300">Critical</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900"
                    style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
                  >
                    <Layers className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Single Line Diagram</h3>
                    <p className="text-muted-foreground text-center mb-4 max-w-md">
                      Upload a Single Line Diagram image to visualize your substation layout and map assets for quick navigation.
                    </p>
                    {canManage && (
                      <Button onClick={() => setShowUploadDialog(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload SLD Image
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Site Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Site Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Site</span>
                  <span className="font-medium">{site?.site_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Assets</span>
                  <span className="font-medium">{assets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mapped on SLD</span>
                  <span className="font-medium">{markers.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Asset List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  Assets on Diagram
                  <Badge variant="secondary">{markers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto">
                  {markers.length > 0 ? (
                    markers.map((marker) => (
                      <div
                        key={marker.id}
                        className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-0"
                        onClick={() => !manageMode && navigate(`/assets/${marker.asset_type}/${marker.asset_id}`)}
                        onMouseEnter={() => setHoveredMarker(marker.id)}
                        onMouseLeave={() => setHoveredMarker(null)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            marker.status === 'critical' ? 'bg-red-500' :
                            marker.status === 'warning' ? 'bg-amber-500' :
                            'bg-green-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{marker.asset_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {marker.asset_type?.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        {manageMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMarker(marker.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No assets mapped yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Unmapped Assets */}
            {manageMode && unmappedAssets.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Unmapped Assets
                    <Badge variant="outline">{unmappedAssets.length}</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Click on diagram to place these
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[200px] overflow-y-auto">
                    {unmappedAssets.map((asset) => (
                      <div
                        key={asset.asset_id}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-muted/50 border-b last:border-0"
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          asset.status === 'critical' ? 'bg-red-500' :
                          asset.status === 'warning' ? 'bg-amber-500' :
                          'bg-green-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{asset.asset_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {asset.asset_type?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => navigate(`/dashboard/${siteId}`)}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  View Site Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => navigate(`/sites`)}
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Back to Sites
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Single Line Diagram</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>SLD Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a PNG, JPG, or SVG image of your Single Line Diagram
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Marker Dialog */}
      <Dialog open={showAddMarkerDialog} onOpenChange={setShowAddMarkerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Asset to Diagram</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Asset</Label>
              <Select value={selectedAssetForMarker} onValueChange={setSelectedAssetForMarker}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose an asset..." />
                </SelectTrigger>
                <SelectContent>
                  {unmappedAssets.map((asset) => (
                    <SelectItem key={asset.asset_id} value={asset.asset_id}>
                      <div className="flex items-center gap-2">
                        <span>{asset.asset_name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({asset.asset_type?.replace('_', ' ')})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMarkerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMarker} disabled={!selectedAssetForMarker}>
              <Plus className="w-4 h-4 mr-2" />
              Add to Diagram
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SingleLineDiagramPage;
