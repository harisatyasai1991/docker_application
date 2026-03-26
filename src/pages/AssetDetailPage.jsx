import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { QRCode } from 'react-qr-code';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { AppHeader } from '../components/AppHeader';
import { ModuleTabs } from '../components/ModuleTabs';
import { OnlineMonitoringTab } from '../components/OnlineMonitoringTab';
import { TestRecordsTab } from '../components/TestRecordsTab';
import { AnalyticsTab } from '../components/AnalyticsTab';
import { AssetUptimeSection } from '../components/AssetUptimeSection';
import DailyLogTab from '../components/DailyLogTab';
import DailyLogFormModal from '../components/DailyLogFormModal';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates';
import { DownloadForOfflineDialog } from '../components/DownloadForOfflineDialog';
import { useAPIData } from '../hooks/useAPI';
import { assetsAPI, alertsAPI, offlineAPI, sitesAPI, moduleLinksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Checkbox } from '../components/ui/checkbox';
import { 
  Activity,
  Calendar,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Zap,
  FileText,
  Wrench,
  ClipboardCheck,
  ClipboardList,
  Info,
  XCircle,
  Send,
  Bot,
  QrCode,
  Printer,
  Share2,
  LogOut,
  Download,
  Lock,
  Unlock,
  ShoppingCart,
  User as UserIcon,
  Upload,
  Camera,
  Image as ImageIcon,
  X,
  Edit,
  Plus,
  Trash2,
  Copy,
  Globe,
  Building2,
  ChevronRight,
  ChevronDown,
  MapPin,
  Thermometer,
} from 'lucide-react';

export const AssetDetailPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { assetType, assetId } = useParams();
  const { currentUser, hasPermission } = useAuth();
  const [nameplateOpen, setNameplateOpen] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState('observation');
  const [notes, setNotes] = useState(() => {
    // Load notes from localStorage
    const savedNotes = localStorage.getItem(`notes-${assetId}`);
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  
  // QR Code ref for download/print
  const qrCodeRef = useRef(null);
  
  // Photo upload state
  const [showPhotoUploadDialog, setShowPhotoUploadDialog] = useState(false);
  const [newPhotoPreview, setNewPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Nameplate edit state
  const [showNameplateEditDialog, setShowNameplateEditDialog] = useState(false);
  const [editedNameplateData, setEditedNameplateData] = useState({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [updatingNameplate, setUpdatingNameplate] = useState(false);
  const [recommendedParameters, setRecommendedParameters] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Offline capability state
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [assetLock, setAssetLock] = useState(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  
  // Duplicate asset state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateAssetName, setDuplicateAssetName] = useState('');
  const [duplicateSerialNumber, setDuplicateSerialNumber] = useState('');
  const [duplicatingAsset, setDuplicatingAsset] = useState(false);
  
  // Cross-module linked equipment state
  const [linkedEquipment, setLinkedEquipment] = useState([]);
  const [loadingLinkedEquipment, setLoadingLinkedEquipment] = useState(false);
  
  // Online/Offline tab state
  const [activeMonitoringTab, setActiveMonitoringTab] = useState('offline');
  
  // Daily Log modal state
  const [showDailyLogModal, setShowDailyLogModal] = useState(false);
  const [dailyLogRefreshKey, setDailyLogRefreshKey] = useState(0);
  
  // Region/Site breadcrumb state
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionsSummary, setRegionsSummary] = useState(null);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [sitesInRegion, setSitesInRegion] = useState([]);
  const [currentSite, setCurrentSite] = useState(null);
  const { isMaster } = useAuth();
  
  // Check asset lock status
  React.useEffect(() => {
    const checkLockStatus = async () => {
      try {
        const lockStatus = await offlineAPI.getAssetLockStatus(assetId);
        if (lockStatus.is_locked) {
          setAssetLock({
            locked: true,
            lock: {
              locked_at: lockStatus.locked_at,
              locked_by: lockStatus.locked_by,
              version_hash: lockStatus.version_hash
            },
            session: {
              session_id: lockStatus.lock_session_id,
              user_name: lockStatus.locked_by
            }
          });
        } else {
          setAssetLock(null);
        }
      } catch (error) {
        console.error('Failed to check lock status:', error);
      }
    };

    if (assetId) {
      checkLockStatus();
    }
  }, [assetId]);

  // Fetch linked Online Monitoring equipment
  React.useEffect(() => {
    const fetchLinkedEquipment = async () => {
      if (!assetId) return;
      
      setLoadingLinkedEquipment(true);
      try {
        const response = await moduleLinksAPI.getLinkedEquipmentByAsset(assetId);
        setLinkedEquipment(response.equipment || []);
      } catch (error) {
        console.error('Failed to fetch linked equipment:', error);
        setLinkedEquipment([]);
      } finally {
        setLoadingLinkedEquipment(false);
      }
    };

    fetchLinkedEquipment();
  }, [assetId]);

  // Admin unlock handler
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  
  const handleAdminUnlock = async () => {
    if (!unlockReason.trim()) {
      toast.error('Please enter a reason for unlocking');
      return;
    }
    
    if (!warningAcknowledged) {
      toast.error('Please acknowledge the warning to proceed');
      return;
    }

    try {
      await offlineAPI.unlockAsset(assetId, {
        unlocked_by: currentUser?.full_name || currentUser?.username,
        reason: unlockReason,
        warning_acknowledged: true
      });

      toast.success(
        <div>
          <div className="font-semibold">Asset Unlocked</div>
          <div className="text-xs mt-1 text-amber-600">
            Warning: Offline data from previous session may not sync properly
          </div>
        </div>
      );
      setAssetLock(null);
      setShowUnlockDialog(false);
      setUnlockReason('');
      setWarningAcknowledged(false);
    } catch (error) {
      toast.error('Failed to unlock asset');
      console.error(error);
    }
  };

  // Chatbot state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: 'Hello! I\'m your AI assistant for asset monitoring. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  // Fetch asset data from API
  const { data: asset, loading: assetLoading, error: assetError } = useAPIData(
    () => assetsAPI.getById(assetId),
    [assetId]
  );
  
  // Fetch alerts for this asset
  const { data: alerts, loading: alertsLoading } = useAPIData(
    () => alertsAPI.getAll({ asset_id: assetId }),
    [assetId]
  );
  
  // Fetch regions summary for dropdown
  useEffect(() => {
    const fetchRegionsSummary = async () => {
      setRegionsLoading(true);
      try {
        const companyId = !isMaster() && currentUser?.company_id ? currentUser.company_id : null;
        const data = await sitesAPI.getRegionsSummary(companyId);
        setRegionsSummary(data);
      } catch (err) {
        console.error('Failed to load regions summary:', err);
      } finally {
        setRegionsLoading(false);
      }
    };
    
    if (currentUser) {
      fetchRegionsSummary();
    }
  }, [currentUser, isMaster]);

  // Fetch current site based on asset's site_id
  useEffect(() => {
    const fetchCurrentSite = async () => {
      if (asset?.site_id) {
        try {
          const siteData = await sitesAPI.getById(asset.site_id);
          setCurrentSite(siteData);
        } catch (err) {
          console.error('Failed to fetch current site:', err);
        }
      }
    };
    
    if (asset) {
      fetchCurrentSite();
    }
  }, [asset]);

  // Set selected region based on current site
  useEffect(() => {
    if (currentSite && regionsSummary?.regions) {
      const siteRegion = (currentSite.region || 'main').toLowerCase();
      const matchingRegion = regionsSummary.regions.find(r => 
        r.region.toLowerCase() === siteRegion
      );
      if (matchingRegion) {
        setSelectedRegion(matchingRegion);
      }
    }
  }, [currentSite, regionsSummary]);

  // Fetch sites in selected region for dropdown (or all sites if no region selected)
  useEffect(() => {
    const fetchSitesInRegion = async () => {
      try {
        const filters = {};
        if (!isMaster() && currentUser?.company_id) {
          filters.company_id = currentUser.company_id;
        }
        const allSites = await sitesAPI.getAll(filters);
        
        // If no region selected, show all sites
        if (!selectedRegion) {
          setSitesInRegion(allSites);
          return;
        }
        
        // Otherwise filter by region
        const regionKey = selectedRegion.region?.toLowerCase() || 'main';
        const filtered = allSites.filter(s => {
          const siteRegion = (s.region || 'main').toLowerCase();
          return siteRegion === regionKey || 
                 (regionKey === 'main' && (!s.region || s.region === ''));
        });
        setSitesInRegion(filtered);
      } catch (err) {
        console.error('Failed to fetch sites in region:', err);
      }
    };
    fetchSitesInRegion();
  }, [selectedRegion, currentUser, isMaster]);

  // Handle region selection from dropdown
  const handleRegionSelect = (regionKey) => {
    if (regionKey === 'all') {
      setSelectedRegion(null);
      // Don't navigate away - just clear the region filter
    } else {
      const selected = regionsSummary?.regions?.find(r => r.region === regionKey);
      if (selected) {
        setSelectedRegion(selected);
      }
    }
  };

  // Handle site selection from dropdown
  const handleSiteSelect = (newSiteId) => {
    if (newSiteId) {
      navigate(`/dashboard/${newSiteId}`);
    }
  };
  
  // Get nameplate data and photo from asset object (from API)
  const nameplateData = asset?.nameplate_details || {};
  // Default asset images matching onboarding wizard
  const getDefaultAssetImage = (assetType) => {
    const defaultImages = {
      'transformer': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect fill="%23e5e7eb" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="%236b7280"%3ETransformer%3C/text%3E%3C/svg%3E',
      'switchgear': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect fill="%23e5e7eb" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="%236b7280"%3ESwitchgear%3C/text%3E%3C/svg%3E',
      'motors': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect fill="%23e5e7eb" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="%236b7280"%3EMotor%3C/text%3E%3C/svg%3E',
      'generators': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect fill="%23e5e7eb" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="%236b7280"%3EGenerator%3C/text%3E%3C/svg%3E',
      'cables': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect fill="%23e5e7eb" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="%236b7280"%3ECable%3C/text%3E%3C/svg%3E',
      'ups': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect fill="%23e5e7eb" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="%236b7280"%3EUPS%3C/text%3E%3C/svg%3E',
    };
    return defaultImages[assetType] || defaultImages['transformer'];
  };
  
  const assetPhoto = asset?.asset_photo_url || getDefaultAssetImage(assetType);
  
  const assetTypeNames = {
    transformer: 'Transformer',
    switchgear: 'Switch Gear',
    motors: 'Motors',
    generators: 'Generators',
    cables: 'Cables',
    ups: 'UPS'
  };
  
  // Helper to get display name for asset type (handles case-insensitivity)
  const getAssetTypeDisplayName = (type) => {
    if (!type) return 'Asset';
    const lowerType = type.toLowerCase();
    return assetTypeNames[lowerType] || type;
  };

  // Show loading state
  if (assetLoading) {
    return (
      <div className="min-h-screen">
        <AppHeader onLogout={onLogout} />
        <LoadingSpinner size="lg" text="Loading asset details..." />
      </div>
    );
  }

  // Show error state
  if (assetError || !asset) {
    return (
      <div className="min-h-screen">
        <AppHeader onLogout={onLogout} />
        <ErrorMessage 
          error={assetError || 'Asset not found'} 
          retry={() => window.location.reload()} 
        />
      </div>
    );
  }
  
  // Determine operational status based on health score
  const isOperational = asset?.health_score >= 80;

  const handleSaveNote = () => {
    if (noteText.trim()) {
      const newNote = {
        id: Date.now(),
        text: noteText,
        category: noteCategory,
        timestamp: new Date().toISOString(),
        user: 'Current User' // In real app, this would be actual logged-in user
      };
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      localStorage.setItem(`notes-${assetId}`, JSON.stringify(updatedNotes));
      setNoteText('');
      // Show success toast
    }
  };

  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem(`notes-${assetId}`, JSON.stringify(updatedNotes));
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const userMessage = {
        id: Date.now(),
        type: 'user',
        message: chatInput,
        timestamp: new Date().toISOString()
      };
      setChatMessages([...chatMessages, userMessage]);
      setChatInput('');
      
      // Simulate AI response (placeholder for future AI integration)
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          message: 'AI integration coming soon! This will provide intelligent insights about your asset.',
          timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, botMessage]);
      }, 1000);
    }
  };

  // Handle WhatsApp Share
  const handleWhatsAppShare = () => {
    const assetUrl = window.location.href;
    const message = `Check out this asset: ${asset?.asset_name} (${asset?.asset_id})\nHealth Score: ${asset?.health_score}/100\n${assetUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Get QR Code URL
  const getAssetQRCodeUrl = () => {
    // Use the current window origin to generate the QR code URL
    const baseUrl = window.location.origin;
    return `${baseUrl}/assets/${assetType}/${assetId}`;
  };

  // Handle Download QR Code as PNG
  const handleDownloadQRCode = () => {
    const svg = qrCodeRef.current?.querySelector('svg');
    if (!svg) {
      toast.error('QR Code not found');
      return;
    }

    try {
      // Convert SVG to canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Download as PNG
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${asset?.asset_name || assetId}-QRCode.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success('QR Code downloaded successfully');
        });
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  // Handle Print QR Code Label
  const handlePrintQRCode = () => {
    const qrCodeUrl = getAssetQRCodeUrl();
    const printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Asset QR Code - ${asset?.asset_name || assetId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            .qr-label {
              border: 2px solid #333;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
              border-radius: 8px;
            }
            h2 {
              margin: 0 0 10px 0;
              font-size: 20px;
              color: #333;
            }
            .asset-info {
              margin: 15px 0;
              font-size: 14px;
              color: #666;
            }
            .qr-container {
              margin: 20px 0;
              display: flex;
              justify-content: center;
            }
            .instructions {
              font-size: 12px;
              color: #999;
              margin-top: 15px;
            }
            @media print {
              body { padding: 0; }
              .qr-label { border-color: #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-label">
            <h2>${asset?.asset_name || 'Asset'}</h2>
            <div class="asset-info">
              <strong>Asset ID:</strong> ${asset?.asset_id || assetId}<br>
              <strong>Type:</strong> ${asset?.asset_type || assetType}
            </div>
            <div class="qr-container" id="qr-code-container"></div>
            <div class="instructions">
              Scan this QR code to view asset details
            </div>
          </div>
          <script src="https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js"></script>
          <script>
            QRCode.toCanvas('${qrCodeUrl}', { width: 200, margin: 2 }, function (err, canvas) {
              if (err) console.error(err);
              document.getElementById('qr-code-container').appendChild(canvas);
              setTimeout(() => window.print(), 500);
            });
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Handle photo upload
  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle photo update submission
  const handlePhotoUpdate = async () => {
    if (!newPhotoPreview) {
      toast.error('Please select a photo');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Update asset with new photo
      await assetsAPI.update(assetId, {
        asset_photo_url: newPhotoPreview
      });
      
      toast.success('Asset photo updated successfully!');
      setShowPhotoUploadDialog(false);
      setNewPhotoPreview(null);
      
      // Reload the page to show updated photo
      window.location.reload();
    } catch (error) {
      console.error('Failed to update photo:', error);
      toast.error('Failed to update photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle nameplate edit dialog open
  const handleNameplateEditOpen = async () => {
    setEditedNameplateData({ ...nameplateData });
    setShowNameplateEditDialog(true);
    setNameplateOpen(false); // Close the view dialog
    
    // Load recommended parameters
    try {
      const recommendations = await assetsAPI.getNameplateParameters(assetType);
      setRecommendedParameters(recommendations.parameters || []);
    } catch (error) {
      console.error('Failed to load recommended parameters:', error);
      setRecommendedParameters([]);
    }
  };

  // Handle nameplate field update
  const handleNameplateFieldUpdate = (key, value) => {
    setEditedNameplateData({
      ...editedNameplateData,
      [key]: value
    });
  };

  // Handle nameplate field delete
  const handleNameplateFieldDelete = (key) => {
    const updated = { ...editedNameplateData };
    delete updated[key];
    setEditedNameplateData(updated);
  };

  // Handle add new nameplate field
  const handleAddNameplateField = () => {
    if (!newFieldKey.trim()) {
      toast.error('Please enter a field name');
      return;
    }
    if (editedNameplateData[newFieldKey]) {
      toast.error('This field already exists');
      return;
    }
    
    setEditedNameplateData({
      ...editedNameplateData,
      [newFieldKey]: newFieldValue
    });
    setNewFieldKey('');
    setNewFieldValue('');
  };
  
  // Handle add recommended parameter
  const handleAddRecommendedParameter = (param) => {
    if (editedNameplateData[param.key]) {
      toast.warning(`${param.label} already exists`);
      return;
    }
    
    setEditedNameplateData({
      ...editedNameplateData,
      [param.key]: param.example
    });
    toast.success(`Added ${param.label}`);
  };

  // Handle nameplate update submission
  const handleNameplateUpdate = async () => {
    setUpdatingNameplate(true);
    try {
      console.log('Updating nameplate with data:', editedNameplateData);
      
      const result = await assetsAPI.update(assetId, {
        nameplate_details: editedNameplateData
      });
      
      console.log('Update result:', result);
      
      toast.success('Nameplate details updated successfully! Refreshing...');
      
      // Small delay to show toast
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Force navigation to same URL with timestamp to force fresh load
      const currentPath = window.location.pathname;
      window.location.href = currentPath + '?refresh=' + Date.now();
    } catch (error) {
      console.error('Failed to update nameplate:', error);
      toast.error('Failed to update nameplate details: ' + (error.message || 'Unknown error'));
      setUpdatingNameplate(false);
    }
  };

  // Duplicate Asset Handler
  const handleDuplicateAsset = async () => {
    if (!duplicateAssetName.trim()) {
      toast.error('Please enter a name for the new asset');
      return;
    }
    
    setDuplicatingAsset(true);
    try {
      // Create duplicate asset with same configuration but new name/serial
      const duplicateData = {
        asset_name: duplicateAssetName.trim(),
        asset_type: asset.asset_type,
        asset_type_id: asset.asset_type_id,
        manufacturer: asset.manufacturer,
        model: asset.model,
        serial_number: duplicateSerialNumber.trim() || `${asset.serial_number}-COPY`,
        voltage_level: asset.voltage_level,
        installation_date: asset.installation_date,
        location_detail: asset.location_detail,
        site_ids: asset.site_ids || [],
        nameplate_details: asset.nameplate_details || {},
        assigned_tests: asset.assigned_tests || [],
        health_score: 100, // Reset health score for new asset
        status: 'Active',
      };

      const result = await assetsAPI.create(duplicateData);
      toast.success(`Asset "${duplicateAssetName}" created successfully!`);
      setShowDuplicateDialog(false);
      setDuplicateAssetName('');
      setDuplicateSerialNumber('');
      
      // Navigate to the new asset
      if (result?.asset_id) {
        navigate(`/assets/${assetType}/${result.asset_id}`);
      }
    } catch (error) {
      console.error('Failed to duplicate asset:', error);
      toast.error('Failed to duplicate asset: ' + (error.message || 'Unknown error'));
    } finally {
      setDuplicatingAsset(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'observation': return <CheckCircle2 className="w-4 h-4" />;
      case 'issue': return <AlertCircle className="w-4 h-4" />;
      case 'reminder': return <Calendar className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'observation': return 'border-primary text-primary';
      case 'issue': return 'border-[hsl(var(--status-critical))] text-[hsl(var(--status-critical))]';
      case 'reminder': return 'border-[hsl(var(--status-warning))] text-[hsl(var(--status-warning))]';
      default: return 'border-muted text-muted-foreground';
    }
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Asset Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested asset could not be found.</p>
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getHealthStatus = (score) => {
    if (score >= 80) return { label: 'Healthy', color: 'text-[hsl(var(--status-healthy))]', bg: 'bg-[hsl(var(--status-healthy))]/10' };
    if (score >= 60) return { label: 'Warning', color: 'text-[hsl(var(--status-warning))]', bg: 'bg-[hsl(var(--status-warning))]/10' };
    return { label: 'Critical', color: 'text-[hsl(var(--status-critical))]', bg: 'bg-[hsl(var(--status-critical))]/10' };
  };

  const healthStatus = getHealthStatus(asset.health_score);

  // Mock maintenance history
  const maintenanceHistory = [
    { date: '2024-01-15', type: 'Preventive', description: 'Routine inspection and testing', status: 'Completed' },
    { date: '2023-10-20', type: 'Corrective', description: 'Minor repairs performed', status: 'Completed' },
    { date: '2023-07-10', type: 'Preventive', description: 'Scheduled maintenance', status: 'Completed' },
    { date: '2023-04-05', type: 'Preventive', description: 'Annual comprehensive check', status: 'Completed' }
  ];

  // Mock performance metrics
  const performanceMetrics = [
    { label: 'Efficiency', value: 92, unit: '%' },
    { label: 'Temperature', value: 68, unit: '°C', max: 85 },
    { label: 'Load Factor', value: 78, unit: '%' },
    { label: 'Vibration Level', value: 45, unit: 'mm/s', max: 100 }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <AppHeader onLogout={onLogout} />
      
      {/* Module Tabs */}
      <ModuleTabs />
      
      {/* Custom Breadcrumb with Region/Site Dropdowns */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1 text-sm flex-wrap" aria-label="Breadcrumb">
            {/* Home */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/sites')}
            >
              <span>Home</span>
            </Button>
            
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            
            {/* Region Dropdown - Show as "All Sites" when no regions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-2 font-medium bg-background"
                >
                  <Globe className="w-4 h-4" />
                  {selectedRegion ? selectedRegion.region_name : 'All Sites'}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Select Region</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleRegionSelect('all')}
                  className={!selectedRegion ? 'bg-accent' : ''}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  All Sites
                  <Badge variant="outline" className="ml-auto">{regionsSummary?.total_sites || 0}</Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {regionsSummary?.regions?.map((region) => (
                  <DropdownMenuItem 
                    key={region.region}
                    onClick={() => handleRegionSelect(region.region)}
                    className={selectedRegion?.region === region.region ? 'bg-accent' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{region.region_name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {region.site_count}
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            
            {/* Site Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-2 font-medium bg-background"
                >
                  <Building2 className="w-4 h-4" />
                  {currentSite ? currentSite.site_name : 'Select Site'}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>
                  {selectedRegion ? `Sites in ${selectedRegion.region_name}` : 'All Sites'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sitesInRegion.length > 0 ? (
                  sitesInRegion.map((s) => (
                    <DropdownMenuItem 
                      key={s.site_id}
                      onClick={() => handleSiteSelect(s.site_id)}
                      className={`py-2 ${currentSite?.site_id === s.site_id ? 'bg-accent' : ''}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            s.status === 'critical' ? 'bg-red-500' :
                            s.status === 'warning' ? 'bg-amber-500' :
                            'bg-green-500'
                          }`} />
                          <div>
                            <p className="font-medium text-sm">{s.site_name}</p>
                            <p className="text-xs text-muted-foreground">{s.location || 'No location'}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {s.total_assets || 0} assets
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No sites available
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            
            {/* Asset Type */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(`/assets/${assetType?.toLowerCase() || assetType}`)}
            >
              <span>{getAssetTypeDisplayName(assetType)}</span>
            </Button>
            
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            
            {/* Current Asset */}
            <span className="text-sm font-medium text-foreground px-2">
              {asset.asset_name || asset.name || 'Asset'}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Asset Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border-border/50 shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{asset.asset_name}</CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">{asset.asset_id}</p>
                </div>
                <Badge className={`${healthStatus.bg} ${healthStatus.color} border-0 text-sm px-3 py-1`}>
                  {healthStatus.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Online/Offline Monitoring Tabs */}
              <Tabs value={activeMonitoringTab} onValueChange={setActiveMonitoringTab} className="w-full">
                <TabsList className="grid w-full max-w-3xl grid-cols-5 mb-4">
                  <TabsTrigger 
                    value="offline" 
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                    data-testid="offline-tab"
                  >
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    Offline Testing
                  </TabsTrigger>
                  <TabsTrigger 
                    value="online" 
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    data-testid="online-tab"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Online Monitoring
                  </TabsTrigger>
                  <TabsTrigger 
                    value="daily-readings" 
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                    data-testid="daily-readings-tab"
                  >
                    <Thermometer className="w-4 h-4 mr-2" />
                    Daily Readings
                  </TabsTrigger>
                  <TabsTrigger 
                    value="test-records" 
                    className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                    data-testid="test-records-tab"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Test Records
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
                    data-testid="analytics-tab"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
                
                {/* Offline Testing Tab Content */}
                <TabsContent value="offline" className="mt-0">
              {/* Two Column Layout: Photo Left, Details Right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Asset Photo */}
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-border group">
                    <img 
                      src={assetPhoto} 
                      alt={asset.asset_name}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white text-sm font-medium">{getAssetTypeDisplayName(assetType)} Equipment</p>
                    </div>
                    
                    {/* Edit Photo Button - Only for Admin */}
                    {(currentUser?.role === 'admin' || currentUser?.role === 'master') && (
                      <div className="absolute top-2 right-2">
                        <Button
                          size="sm"
                          onClick={() => setShowPhotoUploadDialog(true)}
                          className="bg-white/90 hover:bg-white text-gray-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Camera className="w-4 h-4 mr-1" />
                          Edit Photo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Important Details */}
                <div className="space-y-2.5">
                  <div className="space-y-2">
                    {/* Health Score */}
                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Health Score</p>
                        <p className={`text-2xl font-bold ${healthStatus.color}`}>{asset.health_score}/100</p>
                      </div>
                      <Progress value={asset.health_score} className="h-3" />
                    </div>

                    {/* Test Dates - Same Line with Smaller Icons */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg border border-[hsl(var(--status-warning))]/50 bg-[hsl(var(--status-warning))]/5">
                        <p className="text-xs text-muted-foreground mb-0.5">Next Test Due</p>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1.5 text-[hsl(var(--status-warning))]" />
                          <p className="text-xs font-semibold">{asset.nextTestDate}</p>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg border border-border bg-card">
                        <p className="text-xs text-muted-foreground mb-0.5">Last Test Date</p>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1.5 text-muted-foreground" />
                          <p className="text-xs font-semibold">{asset.last_test_dateDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Operational Status - Same Line */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-2 rounded-lg border text-center transition-smooth cursor-pointer ${
                        isOperational 
                          ? 'border-[hsl(var(--status-healthy))] bg-[hsl(var(--status-healthy))]/10 shadow-sm' 
                          : 'border-border/50 bg-muted/20 opacity-60 hover:opacity-80'
                      }`}>
                        <CheckCircle2 className={`w-4 h-4 mx-auto mb-0.5 ${
                          isOperational ? 'text-[hsl(var(--status-healthy))]' : 'text-muted-foreground'
                        }`} />
                        <p className={`text-xs font-medium ${
                          isOperational ? 'text-foreground' : 'text-muted-foreground'
                        }`}>Operational</p>
                      </div>
                      <div className={`p-2 rounded-lg border text-center transition-smooth cursor-pointer ${
                        !isOperational 
                          ? 'border-[hsl(var(--status-critical))] bg-[hsl(var(--status-critical))]/10 shadow-sm' 
                          : 'border-border/50 bg-muted/20 opacity-60 hover:opacity-80'
                      }`}>
                        <Zap className={`w-4 h-4 mx-auto mb-0.5 ${
                          !isOperational ? 'text-[hsl(var(--status-critical))]' : 'text-muted-foreground'
                        }`} />
                        <p className={`text-xs font-medium ${
                          !isOperational ? 'text-foreground' : 'text-muted-foreground'
                        }`}>De-Energized</p>
                      </div>
                    </div>

                    {/* Nameplate Details Button and QR Code - Same Line */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Nameplate Details Button */}
                      <Dialog open={nameplateOpen} onOpenChange={setNameplateOpen}>
                        <DialogTrigger asChild>
                          <div className="p-3 rounded-lg border border-primary/50 bg-primary/5 text-center cursor-pointer hover:bg-primary/10 transition-smooth">
                            <Info className="w-5 h-5 text-primary mx-auto mb-1" />
                            <p className="text-xs font-medium">View Nameplate</p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <DialogTitle className="text-2xl flex items-center">
                                  <Info className="w-6 h-6 mr-2 text-primary" />
                                  Nameplate Specifications
                                </DialogTitle>
                                <DialogDescription>
                                  Complete technical specifications for {asset.asset_name}
                                </DialogDescription>
                              </div>
                              {(currentUser?.role === 'admin' || currentUser?.role === 'master') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleNameplateEditOpen}
                                  className="flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit Nameplate
                                </Button>
                              )}
                            </div>
                          </DialogHeader>
                          <div className="mt-6">
                            {Object.keys(nameplateData).length > 0 ? (
                              <div className="grid grid-cols-2 gap-4">
                                {Object.entries(nameplateData).map(([key, value]) => (
                                  <div key={key} className="border-b border-border pb-3">
                                    <p className="text-sm text-muted-foreground capitalize mb-1">
                                      {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                                    </p>
                                    <p className="font-semibold text-sm">{value || 'N/A'}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Info className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                  No nameplate details available for this asset.
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Nameplate details can be added during asset onboarding or by editing the asset.
                                </p>
                              </div>
                            )}
                            
                            {/* Basic Asset Information - Always Show */}
                            <div className="mt-6 pt-6 border-t">
                              <h3 className="font-semibold mb-4">Basic Asset Information</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="border-b border-border pb-3">
                                  <p className="text-sm text-muted-foreground mb-1">Asset Name</p>
                                  <p className="font-semibold text-sm">{asset?.asset_name || 'N/A'}</p>
                                </div>
                                <div className="border-b border-border pb-3">
                                  <p className="text-sm text-muted-foreground mb-1">Asset Type</p>
                                  <p className="font-semibold text-sm capitalize">{asset?.asset_type || 'N/A'}</p>
                                </div>
                                <div className="border-b border-border pb-3">
                                  <p className="text-sm text-muted-foreground mb-1">Manufacturer</p>
                                  <p className="font-semibold text-sm">{asset?.manufacturer || 'N/A'}</p>
                                </div>
                                <div className="border-b border-border pb-3">
                                  <p className="text-sm text-muted-foreground mb-1">Model</p>
                                  <p className="font-semibold text-sm">{asset?.model || 'N/A'}</p>
                                </div>
                                <div className="border-b border-border pb-3">
                                  <p className="text-sm text-muted-foreground mb-1">Serial Number</p>
                                  <p className="font-semibold text-sm">{asset?.serial_number || 'N/A'}</p>
                                </div>
                                <div className="border-b border-border pb-3">
                                  <p className="text-sm text-muted-foreground mb-1">Installation Date</p>
                                  <p className="font-semibold text-sm">{asset?.installation_date || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* QR Code */}
                      <Dialog open={qrCodeOpen} onOpenChange={setQrCodeOpen}>
                        <DialogTrigger asChild>
                          <div className="p-3 rounded-lg border border-border bg-muted/20 text-center cursor-pointer hover:bg-muted/30 transition-smooth">
                            <QrCode className="w-5 h-5 text-primary mx-auto mb-1" />
                            <p className="text-xs font-medium">Asset QR Code</p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center">
                              <QrCode className="w-6 h-6 mr-2 text-primary" />
                              Asset QR Code
                            </DialogTitle>
                            <DialogDescription>
                              Scan or share this QR code to access asset details
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-6">
                            {/* Print Area */}
                            <div id="qr-code-print-area" ref={qrCodeRef}>
                              <div className="flex flex-col items-center space-y-4">
                                <h2 className="text-xl font-bold">{asset?.asset_name || asset?.assetName}</h2>
                                <div className="qr-container p-6 bg-white rounded-lg border-2 border-border">
                                  <QRCode 
                                    value={getAssetQRCodeUrl()} 
                                    size={192}
                                    level="H"
                                  />
                                </div>
                                <div className="text-center space-y-1">
                                  <p className="text-sm font-semibold text-muted-foreground">Asset ID: {asset?.asset_id || asset?.assetId}</p>
                                  <p className="text-xs text-muted-foreground">Scan to access asset details</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-3 mt-6">
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={handleDownloadQRCode}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full border-primary hover:bg-primary/10"
                                onClick={handlePrintQRCode}
                              >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full border-green-500 hover:bg-green-50 text-green-700"
                                onClick={handleWhatsAppShare}
                              >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                              </Button>
                            </div>
                            
                            <p className="text-xs text-muted-foreground text-center mt-4">
                              💡 Print and attach this QR code to the physical asset for quick access during inspections
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Duplicate Asset Button - For Admin/Master only */}
                    {(currentUser?.role === 'admin' || currentUser?.role === 'master') && (
                      <div 
                        className="p-3 rounded-lg border border-blue-200 bg-blue-50 text-center cursor-pointer hover:bg-blue-100 transition-smooth"
                        onClick={() => {
                          setDuplicateAssetName(`${asset.asset_name} (Copy)`);
                          setDuplicateSerialNumber('');
                          setShowDuplicateDialog(true);
                        }}
                      >
                        <Copy className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs font-medium text-blue-700">Duplicate Asset</p>
                      </div>
                    )}

                    {/* Cross-Module Link to Online Monitoring */}
                    {linkedEquipment.length > 0 && (
                      <div 
                        className="p-3 rounded-lg border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 cursor-pointer hover:from-cyan-100 hover:to-blue-100 transition-smooth"
                        onClick={() => navigate(`/monitoring/equipment/${linkedEquipment[0].equipment_id}`)}
                        data-testid="online-monitoring-link"
                      >
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Activity className="w-5 h-5 text-cyan-600" />
                          <ChevronRight className="w-4 h-4 text-cyan-400" />
                        </div>
                        <p className="text-xs font-medium text-cyan-700">Online Monitoring</p>
                        <p className="text-[10px] text-cyan-600 mt-0.5">
                          {linkedEquipment[0].health_status === 'critical' 
                            ? '⚠️ Critical Status' 
                            : linkedEquipment[0].health_status === 'warning'
                            ? '⚡ Warning Status'
                            : '✓ Healthy'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                </TabsContent>
                
                {/* Online Monitoring Tab Content */}
                <TabsContent value="online" className="mt-0">
                  <OnlineMonitoringTab 
                    assetId={assetId}
                    assetName={asset.asset_name}
                    assetPhoto={assetPhoto}
                    linkedEquipment={linkedEquipment}
                  />
                </TabsContent>
                
                {/* Test Records Tab Content */}
                <TabsContent value="test-records" className="mt-0">
                  <TestRecordsTab 
                    assetId={assetId}
                    assetName={asset.asset_name}
                  />
                </TabsContent>
                
                {/* Analytics Tab Content */}
                <TabsContent value="analytics" className="mt-0">
                  <AnalyticsTab 
                    assetId={assetId}
                    assetName={asset.asset_name}
                  />
                </TabsContent>

                {/* Daily Readings Tab Content */}
                <TabsContent value="daily-readings" className="mt-0">
                  <DailyLogTab 
                    key={dailyLogRefreshKey}
                    assetId={assetId}
                    assetType={asset.asset_type}
                    companyId={asset.company_id}
                  />
                </TabsContent>
              </Tabs>

              <Separator className="my-4" />

              {/* DMS Insight Assistant - Integrated */}
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Left: Header and Messages */}
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <Bot className="w-5 h-5 mr-2 text-primary" />
                    <h4 className="text-base font-semibold text-primary">DMS Insight Assistant</h4>
                    <Badge variant="outline" className="ml-2 text-xs border-primary/50 text-primary">Beta</Badge>
                  </div>
                  
                  {/* Chat Messages */}
                  <ScrollArea className="h-[110px] rounded-md border border-border bg-muted/30 p-3">
                    <div className="space-y-2">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                            msg.type === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-background text-foreground border border-border'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                {/* Right: Input Area */}
                <div className="lg:w-80 flex flex-col justify-end">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about this asset..."
                      className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="default"
                      className="bg-primary hover:bg-primary-dark px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Ask questions about asset health, maintenance, or diagnostics</p>
                </div>
              </div>

              <Separator />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full justify-start bg-primary hover:bg-primary-dark transition-smooth" 
                size="default"
                onClick={() => navigate(`/assets/${assetType}/${assetId}/test`)}
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Conduct Test
              </Button>
              <Button 
                className="w-full justify-start bg-orange-500 hover:bg-orange-600 text-white transition-smooth" 
                size="default"
                onClick={() => setShowDailyLogModal(true)}
                data-testid="daily-log-btn"
              >
                <Thermometer className="w-4 h-4 mr-2" />
                Daily Log
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start transition-smooth hover:bg-secondary hover:text-secondary-foreground hover:border-secondary" 
                size="default"
                onClick={() => navigate(`/assets/${assetType}/${assetId}/analytics`)}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start transition-smooth hover:bg-accent hover:text-accent-foreground hover:border-accent" 
                size="default"
                onClick={() => navigate(`/assets/${assetType}/${assetId}/reports`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Reports
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start transition-smooth hover:bg-[hsl(var(--dms-red))] hover:text-[hsl(var(--dms-red-foreground))] hover:border-[hsl(var(--dms-red))]" 
                size="default"
                onClick={() => navigate(`/assets/${assetType}/${assetId}/alerts`)}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                View Alerts
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start transition-smooth hover:bg-[hsl(var(--status-maintenance))] hover:text-[hsl(var(--status-maintenance-foreground))] hover:border-[hsl(var(--status-maintenance))]" 
                size="default"
                onClick={() => navigate(`/assets/${assetType}/${assetId}/schedule`)}
              >
                <Wrench className="w-4 h-4 mr-2" />
                Schedule Maintenance
              </Button>

              <Separator className="my-4" />

              {/* Offline Capability Section */}
              {assetLock?.locked ? (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-sm text-orange-900">Offline Testing Active</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-orange-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Session:</span>
                      <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-900">
                        {assetLock.session?.session_id}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-3 h-3" />
                      <span>{assetLock.session?.user_name}</span>
                    </div>
                    {assetLock.session?.sales_orders?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <ShoppingCart className="w-3 h-3 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {assetLock.session.sales_orders.slice(0, 2).map((soId, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-orange-50">
                              SO-{idx + 1}
                            </Badge>
                          ))}
                          {assetLock.session.sales_orders.length > 2 && (
                            <span className="text-xs">+{assetLock.session.sales_orders.length - 2} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-orange-700 pt-1">
                      Downloaded: {new Date(assetLock.lock?.locked_at).toLocaleString()}
                    </div>
                  </div>

                  {hasPermission('unlock_assets') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs border-orange-300 hover:bg-orange-100"
                      onClick={() => setShowUnlockDialog(true)}
                    >
                      <Unlock className="w-3 h-3 mr-1" />
                      Admin Unlock
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start transition-smooth hover:bg-blue-50 hover:border-blue-500"
                  size="default"
                  onClick={() => setShowOfflineDialog(true)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download for Offline Testing
                </Button>
              )}

              <Separator className="my-4" />

              {/* Quick Notes Section */}
              <div className="space-y-1.5 mt-2 p-3 rounded-lg bg-muted/20 border border-primary/20">
                <div className="flex items-center mb-1">
                  <FileText className="w-4 h-4 mr-2 text-primary" />
                  <h3 className="text-sm font-semibold text-primary">Quick Notes</h3>
                </div>

                {/* Note Input Area */}
                <div className="space-y-1.5">
                  <select 
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="observation">Observation</option>
                    <option value="issue">Issue</option>
                    <option value="reminder">Reminder</option>
                  </select>
                  
                  <textarea
                    placeholder="Enter maintenance notes..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                  
                  <Button 
                    onClick={handleSaveNote}
                    disabled={!noteText.trim()}
                    className="w-full bg-primary hover:bg-primary-dark transition-smooth"
                    size="sm"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save Note
                  </Button>
                </div>

                {/* Notes History */}
                <div className="space-y-1 mt-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    History ({notes.length})
                  </p>
                  <ScrollArea className="h-[200px] pr-2">
                    {notes.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-xs">
                        No notes yet. Add your first note above.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {notes.map((note) => (
                          <Card key={note.id} className="border-border/50 bg-muted/30">
                            <CardContent className="p-2.5">
                              <div className="flex items-start justify-between mb-1.5">
                                <Badge variant="outline" className={`text-xs ${getCategoryColor(note.category)}`}>
                                  {getCategoryIcon(note.category)}
                                  <span className="ml-1 capitalize">{note.category}</span>
                                </Badge>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs mb-1.5 leading-relaxed">{note.text}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{note.user}</span>
                                <span>{formatTimestamp(note.timestamp)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Asset Uptime & Maintenance Section */}
        <div className="mb-8">
          <AssetUptimeSection 
            assetId={assetId}
            assetName={asset.asset_name}
          />
        </div>

        {/* Additional Information */}
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-accent" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Installation Date</p>
                <p className="font-semibold">2018-03-15</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="font-semibold">Building A, Floor 3, Room 301</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Serial Number</p>
                <p className="font-semibold font-mono">SN-{asset.asset_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Warranty Status</p>
                <Badge variant="outline" className="border-[hsl(var(--status-healthy))] text-[hsl(var(--status-healthy))]">
                  Active
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Responsible Person</p>
                <p className="font-semibold">John Doe</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Department</p>
                <p className="font-semibold">Facilities Management</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Download for Offline Dialog */}
      <DownloadForOfflineDialog
        open={showOfflineDialog}
        onClose={() => setShowOfflineDialog(false)}
        asset={asset}
      />

      {/* Admin Unlock Dialog */}
      <Dialog open={showUnlockDialog} onOpenChange={(open) => {
        setShowUnlockDialog(open);
        if (!open) {
          setUnlockReason('');
          setWarningAcknowledged(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-orange-600" />
              Admin Unlock Asset
            </DialogTitle>
            <DialogDescription>
              This will remove the offline session lock and allow the asset to be modified.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Warning Banner */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold">⚠️ Data Sync Warning</p>
                  <p className="mt-1">
                    Unlocking this asset will prevent offline test data from syncing. 
                    Any tests conducted offline may become invalid and could corrupt data if synced.
                  </p>
                  <p className="mt-1 font-medium">
                    A conflict report will be generated if sync is attempted after unlock.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason for Unlock <span className="text-red-500">*</span></Label>
              <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={3}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Enter detailed reason for admin unlock..."
              />
            </div>

            {/* Warning Acknowledgment Checkbox */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Checkbox
                id="warning-acknowledge"
                checked={warningAcknowledged}
                onCheckedChange={setWarningAcknowledged}
                className="mt-0.5"
              />
              <label htmlFor="warning-acknowledge" className="text-sm text-amber-900 cursor-pointer">
                I understand that unlocking this asset may cause data conflicts and that offline 
                test data cannot be synced after this action. I acknowledge that a conflict report 
                will be created for manual review.
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUnlockDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdminUnlock} 
              className="bg-red-600 hover:bg-red-700"
              disabled={!unlockReason.trim() || !warningAcknowledged}
            >
              <Unlock className="w-4 h-4 mr-2" />
              Confirm Unlock
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUploadDialog} onOpenChange={setShowPhotoUploadDialog}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Update Asset Photo
            </DialogTitle>
            <DialogDescription>
              Upload a new photo for {asset?.asset_name}. The photo will be displayed on the asset details page.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Current Photo */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Current Photo</Label>
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img 
                  src={assetPhoto} 
                  alt="Current asset photo"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>

            {/* New Photo Preview */}
            {newPhotoPreview && (
              <div>
                <Label className="text-sm font-medium mb-2 block">New Photo Preview</Label>
                <div className="relative rounded-lg overflow-hidden border-2 border-primary">
                  <img 
                    src={newPhotoPreview} 
                    alt="New photo preview"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setNewPhotoPreview(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-center">
              <Label htmlFor="asset-photo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
                  <Upload className="w-4 h-4" />
                  <span>{newPhotoPreview ? 'Change Photo' : 'Upload New Photo'}</span>
                </div>
                <Input
                  id="asset-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </Label>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Guidelines:</strong> Upload a clear photo of the asset. Supported formats: JPG, PNG, GIF. Max size: 5MB.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPhotoUploadDialog(false);
                setNewPhotoPreview(null);
              }}
              disabled={uploadingPhoto}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePhotoUpdate}
              disabled={!newPhotoPreview || uploadingPhoto}
            >
              {uploadingPhoto ? 'Updating...' : 'Update Photo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Nameplate Dialog */}
      <Dialog open={showNameplateEditDialog} onOpenChange={setShowNameplateEditDialog}>
        <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Nameplate Details
            </DialogTitle>
            <DialogDescription>
              Add, update, or remove nameplate specifications for {asset?.asset_name}. Click recommended parameters to add them.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 py-4">
            <div className="grid grid-cols-3 gap-6">
            {/* Left Panel - Editable Fields */}
            <div className="col-span-2 space-y-4">
            {/* Existing Fields */}
            {Object.keys(editedNameplateData).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  Current Nameplate Fields
                  <Badge variant="outline" className="ml-2">{Object.keys(editedNameplateData).length} fields</Badge>
                </h3>
                <div className="space-y-3">
                  {Object.entries(editedNameplateData).map(([key, value]) => {
                    const isStandard = recommendedParameters.some(p => p.key === key);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="relative">
                            <Input
                              value={key}
                              disabled
                              className="bg-muted pr-16"
                              placeholder="Field Name"
                            />
                            {isStandard && (
                              <Badge 
                                variant="outline" 
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs border-green-500 text-green-600"
                              >
                                Standard
                              </Badge>
                            )}
                          </div>
                          <Input
                            value={value}
                            onChange={(e) => handleNameplateFieldUpdate(key, e.target.value)}
                            placeholder="Field Value"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleNameplateFieldDelete(key)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add New Field */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Add Custom Field</h3>
              <div className="flex items-center gap-2">
                <Input
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  placeholder="Field Name (e.g., rated_power)"
                  className="flex-1"
                />
                <Input
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  placeholder="Field Value (e.g., 1000 kVA)"
                  className="flex-1"
                />
                <Button
                  onClick={handleAddNameplateField}
                  size="sm"
                  disabled={!newFieldKey.trim()}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use underscores for multi-word field names (e.g., primary_voltage, cooling_type)
              </p>
            </div>
            </div>

            {/* Right Panel - Recommended Parameters */}
            <div className="col-span-1 border-l pl-6">
              <div className="sticky top-0">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-primary" />
                  Recommended Parameters
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Standard parameters for {getAssetTypeDisplayName(assetType)}. Click to add.
                </p>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {['All', 'Electrical', 'Physical', 'Mechanical', 'General'].map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs"
                    >
                      {category}
                    </Button>
                  ))}
                </div>

                {/* Recommended Parameters List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recommendedParameters
                    .filter(param => selectedCategory === 'All' || param.category === selectedCategory)
                    .map((param, idx) => {
                      const isAdded = editedNameplateData[param.key] !== undefined;
                      return (
                        <Card 
                          key={idx} 
                          className={`cursor-pointer transition-all ${
                            isAdded 
                              ? 'bg-green-50 border-green-300' 
                              : 'hover:bg-blue-50 hover:border-blue-300'
                          }`}
                          onClick={() => !isAdded && handleAddRecommendedParameter(param)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm flex items-center">
                                  {param.label}
                                  {isAdded && (
                                    <CheckCircle2 className="w-4 h-4 ml-2 text-green-600" />
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {param.key}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                  e.g., {param.example}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {param.category}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  {recommendedParameters.filter(param => 
                    selectedCategory === 'All' || param.category === selectedCategory
                  ).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No parameters in this category
                    </p>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-blue-800">
                    <strong>Why use standard parameters?</strong> Using consistent parameter names ensures your data can be analyzed across all assets for better insights and reporting.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNameplateEditDialog(false);
                setNewFieldKey('');
                setNewFieldValue('');
              }}
              disabled={updatingNameplate}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleNameplateUpdate}
              disabled={updatingNameplate}
            >
              {updatingNameplate ? 'Updating...' : 'Update Nameplate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Asset Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-blue-600" />
              Duplicate Asset
            </DialogTitle>
            <DialogDescription>
              Create a copy of this asset with the same configuration (nameplate, assigned tests)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-name">New Asset Name *</Label>
              <Input
                id="duplicate-name"
                value={duplicateAssetName}
                onChange={(e) => setDuplicateAssetName(e.target.value)}
                placeholder="Enter name for the new asset"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duplicate-serial">Serial Number</Label>
              <Input
                id="duplicate-serial"
                value={duplicateSerialNumber}
                onChange={(e) => setDuplicateSerialNumber(e.target.value)}
                placeholder={`Leave empty to use "${asset?.serial_number}-COPY"`}
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Will be copied:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-0.5">
                <li>• Asset type: {asset?.asset_type}</li>
                <li>• Manufacturer & Model</li>
                <li>• Nameplate details ({Object.keys(asset?.nameplate_details || {}).length} fields)</li>
                <li>• Assigned tests ({asset?.assigned_tests?.length || 0} tests)</li>
                <li>• Site assignments</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDuplicateAsset}
              disabled={duplicatingAsset || !duplicateAssetName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {duplicatingAsset ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Create Duplicate
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Log Modal */}
      <DailyLogFormModal
        open={showDailyLogModal}
        onClose={() => setShowDailyLogModal(false)}
        assetId={assetId}
        assetType={asset?.asset_type}
        assetName={asset?.asset_name}
        companyId={asset?.company_id}
        nameplateData={asset?.nameplate_data}
        currentStatus={asset?.operational_status || 'Energized'}
        onLogCreated={() => {
          setDailyLogRefreshKey(prev => prev + 1);
          // Refresh asset data to get updated status
          refetch();
        }}
      />
    </div>
  );
};
