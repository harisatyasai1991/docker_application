import React, { useState, useRef, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { previewCanvasPDF } from '../utils/CanvasPDFGenerator';
import {
  Image as ImageIcon,
  Type,
  Table,
  FileText,
  Save,
  Eye,
  Trash2,
  Plus,
  Grid3X3,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layout,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Minus,
  Square,
  PenTool,
  QrCode,
  BarChart3,
  ImagePlus,
  Building2,
  ClipboardList,
  Hash,
  X,
  Copy,
  Layers,
  Move,
  Maximize2,
  GripVertical,
  FileDown,
  Upload,
  Heading1,
  FootprintsIcon,
  PanelTop,
  PanelBottom,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  FileX,
  List,
  TableOfContents
} from 'lucide-react';

// Canvas sizes (A4 proportions in pixels)
const CANVAS_SIZES = {
  portrait: { width: 595, height: 842 },
  landscape: { width: 842, height: 595 }
};

// Header and footer zones (in pixels from top/bottom)
const HEADER_ZONE_HEIGHT = 100;
const FOOTER_ZONE_HEIGHT = 80;

const GRID_SIZE = 10;

// Component definitions
const COMPONENT_TYPES = [
  { 
    type: 'logo', 
    label: 'Company Logo', 
    icon: ImageIcon, 
    color: 'text-purple-600',
    defaultSize: { width: 150, height: 60 },
    category: 'header',
    supportsImage: true
  },
  { 
    type: 'text', 
    label: 'Text Block', 
    icon: Type, 
    color: 'text-gray-600',
    defaultSize: { width: 200, height: 40 },
    category: 'basic',
    supportsInlineEdit: true
  },
  { 
    type: 'heading', 
    label: 'Heading', 
    icon: Type, 
    color: 'text-blue-600',
    defaultSize: { width: 300, height: 50 },
    category: 'basic',
    supportsInlineEdit: true
  },
  { 
    type: 'test_summary', 
    label: 'Test Summary', 
    icon: ClipboardList, 
    color: 'text-green-600',
    defaultSize: { width: 400, height: 120 },
    category: 'auto'
  },
  { 
    type: 'asset_details', 
    label: 'Asset Details', 
    icon: Building2, 
    color: 'text-blue-600',
    defaultSize: { width: 400, height: 100 },
    category: 'auto'
  },
  { 
    type: 'parameters_table', 
    label: 'Parameters Table', 
    icon: Table, 
    color: 'text-orange-600',
    defaultSize: { width: 450, height: 200 },
    category: 'auto'
  },
  { 
    type: 'sop_steps', 
    label: 'SOP Steps', 
    icon: FileText, 
    color: 'text-teal-600',
    defaultSize: { width: 450, height: 300 },
    category: 'auto'
  },
  { 
    type: 'index_toc', 
    label: 'Index / TOC', 
    icon: List, 
    color: 'text-amber-600',
    defaultSize: { width: 400, height: 200 },
    category: 'auto',
    description: 'Auto-generated table of contents with page numbers'
  },
  { 
    type: 'signature_block', 
    label: 'Signature Block', 
    icon: PenTool, 
    color: 'text-indigo-600',
    defaultSize: { width: 400, height: 100 },
    category: 'footer'
  },
  { 
    type: 'image_placeholder', 
    label: 'Image/Photo', 
    icon: ImagePlus, 
    color: 'text-pink-600',
    defaultSize: { width: 200, height: 150 },
    category: 'media',
    supportsImage: true
  },
  { 
    type: 'chart', 
    label: 'Chart Area', 
    icon: BarChart3, 
    color: 'text-cyan-600',
    defaultSize: { width: 300, height: 200 },
    category: 'media'
  },
  { 
    type: 'qr_code', 
    label: 'QR Code', 
    icon: QrCode, 
    color: 'text-gray-800',
    defaultSize: { width: 80, height: 80 },
    category: 'basic'
  },
  { 
    type: 'divider', 
    label: 'Divider Line', 
    icon: Minus, 
    color: 'text-gray-400',
    defaultSize: { width: 400, height: 10 },
    category: 'basic'
  },
  { 
    type: 'box', 
    label: 'Box/Container', 
    icon: Square, 
    color: 'text-gray-500',
    defaultSize: { width: 200, height: 150 },
    category: 'basic'
  },
  { 
    type: 'page_number', 
    label: 'Page Number', 
    icon: Hash, 
    color: 'text-gray-600',
    defaultSize: { width: 100, height: 30 },
    category: 'footer'
  }
];

// Get component definition
const getComponentDef = (type) => COMPONENT_TYPES.find(c => c.type === type);

// Component renderer for canvas
const CanvasComponent = ({ 
  component, 
  isSelected, 
  onSelect, 
  isEditing, 
  onDoubleClick, 
  onContentChange,
  onImageClick,
  pages // Add pages prop for TOC generation
}) => {
  const def = getComponentDef(component.type);
  const Icon = def?.icon || Square;
  const inputRef = useRef(null);
  
  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Generate TOC entries from all pages - sorted by actual position
  const generateTOCEntries = () => {
    if (!pages || pages.length === 0) return [];
    
    const tocEntries = [];
    const tocComponentTypes = {
      'heading': true,
      'test_summary': 'Test Summary',
      'asset_details': 'Asset Details',
      'parameters_table': 'Parameters Table',
      'sop_steps': 'SOP / Test Procedure',
      'signature_block': 'Signatures & Approval',
      'chart': 'Charts & Analysis'
    };
    
    pages.forEach((page, pageIndex) => {
      const pageNumber = pageIndex + 1;
      const components = page.components || [];
      
      // Filter and collect TOC-worthy components with their Y position
      components.forEach((comp) => {
        // Skip the index_toc component itself
        if (comp.type === 'index_toc') return;
        
        if (comp.type === 'heading' && comp.content) {
          tocEntries.push({
            title: comp.content,
            page: pageNumber,
            y: comp.y || 0,
            isHeading: true
          });
        } else if (tocComponentTypes[comp.type] && comp.type !== 'heading') {
          const label = tocComponentTypes[comp.type];
          // For auto-filled components, check if same type already exists on this page
          const exists = tocEntries.some(e => e.title === label && e.page === pageNumber);
          if (!exists) {
            tocEntries.push({
              title: label,
              page: pageNumber,
              y: comp.y || 0,
              isHeading: false
            });
          }
        }
      });
    });
    
    // Sort by page number first, then by Y position within each page
    tocEntries.sort((a, b) => {
      if (a.page !== b.page) {
        return a.page - b.page; // Sort by page number first
      }
      return a.y - b.y; // Then sort by Y position (top to bottom)
    });
    
    return tocEntries;
  };
  
  const renderContent = () => {
    switch (component.type) {
      case 'logo':
        return (
          <div 
            className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick && onImageClick();
            }}
          >
            {component.imageData ? (
              <img 
                src={component.imageData} 
                alt="Logo" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center">
                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Click to upload</span>
              </div>
            )}
          </div>
        );
      
      case 'text':
        if (isEditing) {
          return (
            <textarea
              ref={inputRef}
              className="w-full h-full p-2 border-2 border-blue-500 rounded resize-none focus:outline-none"
              style={{ 
                fontSize: component.fontSize || 12,
                fontWeight: component.bold ? 'bold' : 'normal',
                fontStyle: component.italic ? 'italic' : 'normal',
                textAlign: component.textAlign || 'left',
                color: component.textColor || '#000'
              }}
              value={component.content || ''}
              onChange={(e) => onContentChange && onContentChange(e.target.value)}
              onBlur={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          );
        }
        return (
          <div 
            className="w-full h-full p-2 overflow-hidden cursor-text"
            style={{ 
              fontSize: component.fontSize || 12,
              fontWeight: component.bold ? 'bold' : 'normal',
              fontStyle: component.italic ? 'italic' : 'normal',
              textAlign: component.textAlign || 'left',
              color: component.textColor || '#000'
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onDoubleClick && onDoubleClick();
            }}
          >
            {component.content || 'Double-click to edit...'}
          </div>
        );
      
      case 'heading':
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="text"
              className="w-full h-full p-2 border-2 border-blue-500 rounded focus:outline-none font-bold"
              style={{ 
                fontSize: component.fontSize || 18,
                textAlign: component.textAlign || 'center',
                color: component.textColor || '#0066cc'
              }}
              value={component.content || ''}
              onChange={(e) => onContentChange && onContentChange(e.target.value)}
              onBlur={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          );
        }
        return (
          <div 
            className="w-full h-full p-2 flex items-center overflow-hidden font-bold cursor-text"
            style={{ 
              fontSize: component.fontSize || 18,
              textAlign: component.textAlign || 'center',
              color: component.textColor || '#0066cc'
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onDoubleClick && onDoubleClick();
            }}
          >
            {component.content || 'Double-click to edit...'}
          </div>
        );
      
      case 'test_summary':
        return (
          <div className="w-full h-full bg-blue-50 border border-blue-200 rounded p-2">
            <div className="text-xs font-semibold text-blue-800 mb-1">Test Summary</div>
            <div className="text-[10px] text-gray-600 space-y-1">
              <div>Test Name: [Auto-filled]</div>
              <div>Test Date: [Auto-filled]</div>
              <div>Conducted By: [Auto-filled]</div>
              <div>Result: [Auto-filled]</div>
            </div>
          </div>
        );
      
      case 'asset_details':
        return (
          <div className="w-full h-full bg-green-50 border border-green-200 rounded p-2">
            <div className="text-xs font-semibold text-green-800 mb-1">Asset Details</div>
            <div className="text-[10px] text-gray-600 space-y-1">
              <div>Asset Name: [Auto-filled]</div>
              <div>Asset ID: [Auto-filled]</div>
              <div>Type: [Auto-filled]</div>
            </div>
          </div>
        );
      
      case 'parameters_table':
        return (
          <div className="w-full h-full bg-orange-50 border border-orange-200 rounded p-2">
            <div className="text-xs font-semibold text-orange-800 mb-1">Parameters Table</div>
            <table className="w-full text-[9px]">
              <thead>
                <tr className="bg-orange-100">
                  <th className="p-1 text-left">Parameter</th>
                  <th className="p-1 text-left">Value</th>
                  <th className="p-1 text-left">Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-1">[Auto]</td><td className="p-1">[Auto]</td><td className="p-1">[Auto]</td></tr>
                <tr><td className="p-1">[Auto]</td><td className="p-1">[Auto]</td><td className="p-1">[Auto]</td></tr>
              </tbody>
            </table>
          </div>
        );
      
      case 'sop_steps':
        return (
          <div className="w-full h-full bg-teal-50 border border-teal-200 rounded p-2 overflow-hidden">
            <div className="text-xs font-semibold text-teal-800 mb-1">SOP Steps</div>
            <div className="text-[9px] text-gray-600 space-y-1">
              <div className="flex gap-1"><span className="font-bold">1.</span> Step title [Auto-filled]</div>
              <div className="flex gap-1"><span className="font-bold">2.</span> Step title [Auto-filled]</div>
              <div className="flex gap-1"><span className="font-bold">3.</span> Step title [Auto-filled]</div>
            </div>
            <div className="mt-2 text-[8px] text-teal-600">+ Photos included</div>
          </div>
        );
      
      case 'index_toc':
        const tocEntries = generateTOCEntries();
        const hasEntries = tocEntries.length > 0;
        
        return (
          <div className="w-full h-full bg-amber-50 border border-amber-200 rounded p-2 overflow-hidden">
            <div className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
              <List className="w-3 h-3" />
              Table of Contents
              {hasEntries && (
                <span className="ml-auto text-[8px] font-normal text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                  {tocEntries.length} items
                </span>
              )}
            </div>
            <div className="text-[9px] text-gray-700 space-y-1">
              {hasEntries ? (
                tocEntries.slice(0, 8).map((entry, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className={entry.isHeading ? 'font-medium' : 'font-normal'}>
                      {index + 1}. {entry.title}
                    </span>
                    <span className="flex-1 border-b border-dotted border-gray-300 mx-2 min-w-[20px]"></span>
                    <span className="text-gray-500">{entry.page}</span>
                  </div>
                ))
              ) : (
                <div className="text-[9px] text-amber-600 italic py-2 text-center">
                  Add headings or sections to populate TOC
                </div>
              )}
              {tocEntries.length > 8 && (
                <div className="text-[8px] text-amber-600 pt-1">
                  + {tocEntries.length - 8} more sections...
                </div>
              )}
            </div>
            <div className="mt-1 text-[8px] text-amber-600 italic">* Auto-updates as you add sections</div>
          </div>
        );
      
      case 'signature_block':
        return (
          <div className="w-full h-full bg-indigo-50 border border-indigo-200 rounded p-2">
            <div className="text-xs font-semibold text-indigo-800 mb-2">Signatures</div>
            <div className="flex justify-around">
              <div className="text-center">
                <div className="w-20 h-8 border-b border-gray-400"></div>
                <span className="text-[9px] text-gray-500">Technician</span>
              </div>
              <div className="text-center">
                <div className="w-20 h-8 border-b border-gray-400"></div>
                <span className="text-[9px] text-gray-500">Supervisor</span>
              </div>
            </div>
          </div>
        );
      
      case 'image_placeholder':
        return (
          <div 
            className="w-full h-full flex items-center justify-center bg-pink-50 border-2 border-dashed border-pink-300 rounded cursor-pointer hover:border-pink-400 hover:bg-pink-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick && onImageClick();
            }}
          >
            {component.imageData ? (
              <img 
                src={component.imageData} 
                alt="Image" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center">
                <ImagePlus className="w-8 h-8 mx-auto text-pink-400 mb-1" />
                <span className="text-xs text-pink-500">Click to upload</span>
              </div>
            )}
          </div>
        );
      
      case 'chart':
        return (
          <div className="w-full h-full bg-cyan-50 border border-cyan-200 rounded p-2 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-cyan-400" />
              <span className="text-xs text-cyan-600">Chart Area</span>
              <p className="text-[9px] text-gray-500">(Auto-generated from parameters)</p>
            </div>
          </div>
        );
      
      case 'qr_code':
        return (
          <div className="w-full h-full bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
            <div className="text-center">
              <QrCode className="w-10 h-10 mx-auto text-gray-600" />
              <span className="text-[8px] text-gray-500">QR Code</span>
            </div>
          </div>
        );
      
      case 'divider':
        return (
          <div className="w-full h-full flex items-center">
            <div 
              className="w-full"
              style={{ 
                height: component.lineWidth || 2,
                backgroundColor: component.lineColor || '#cccccc'
              }}
            ></div>
          </div>
        );
      
      case 'box':
        return (
          <div 
            className="w-full h-full rounded"
            style={{ 
              backgroundColor: component.bgColor || 'transparent',
              border: `${component.borderWidth || 1}px solid ${component.borderColor || '#cccccc'}`
            }}
          ></div>
        );
      
      case 'page_number':
        return (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <span className="text-xs">Page 1 of 1</span>
          </div>
        );
      
      default:
        return (
          <div className="w-full h-full bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
        );
    }
  };

  // Section badge
  const getSectionBadge = () => {
    if (component.section === 'header') {
      return <Badge className="absolute -top-2 left-1 text-[8px] bg-blue-500 px-1 py-0">Header</Badge>;
    }
    if (component.section === 'footer') {
      return <Badge className="absolute -top-2 left-1 text-[8px] bg-orange-500 px-1 py-0">Footer</Badge>;
    }
    return null;
  };

  return (
    <div 
      className={`w-full h-full relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onSelect}
    >
      {getSectionBadge()}
      {renderContent()}
    </div>
  );
};


export const CanvasTemplateDesigner = ({ template = null, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const idCounterRef = useRef(0);
  const [orientation, setOrientation] = useState(template?.orientation || 'portrait');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(0.8);
  const [templateName, setTemplateName] = useState(template?.template_name || '');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [imageUploadTarget, setImageUploadTarget] = useState(null);
  
  // Multi-page support
  const [pages, setPages] = useState(template?.pages || [{ id: 'page-1', components: template?.elements || [] }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const canvasSize = CANVAS_SIZES[orientation];
  const currentPage = pages[currentPageIndex];
  const components = currentPage?.components || [];
  const selectedComponent = components.find(c => c.id === selectedId);

  // Update components for current page
  const setComponents = (newComponents) => {
    const updatedPages = [...pages];
    if (typeof newComponents === 'function') {
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        components: newComponents(components)
      };
    } else {
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        components: newComponents
      };
    }
    setPages(updatedPages);
  };

  // Add new page
  const addPage = () => {
    const newPage = {
      id: `page-${pages.length + 1}-${Date.now()}`,
      components: []
    };
    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
    setSelectedId(null);
    toast.success(`Page ${pages.length + 1} added`);
  };

  // Delete current page
  const deletePage = () => {
    if (pages.length <= 1) {
      toast.error('Cannot delete the only page');
      return;
    }
    const updatedPages = pages.filter((_, idx) => idx !== currentPageIndex);
    setPages(updatedPages);
    setCurrentPageIndex(Math.min(currentPageIndex, updatedPages.length - 1));
    setSelectedId(null);
    toast.success('Page deleted');
  };

  // Navigate pages
  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      setSelectedId(null);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      setSelectedId(null);
    }
  };

  // Generate unique ID
  const generateId = useCallback(() => {
    idCounterRef.current += 1;
    return `comp-${idCounterRef.current}-${performance.now().toString(36).replace('.', '')}`;
  }, []);

  // Snap value to grid
  const snapToGridValue = (value) => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Add component to canvas (current page)
  const addComponent = (type) => {
    const def = getComponentDef(type);
    if (!def) return;

    // Determine initial section based on category
    let section = 'body';
    if (def.category === 'header') section = 'header';
    if (def.category === 'footer') section = 'footer';

    const newComponent = {
      id: generateId(),
      type,
      x: snapToGridValue(50),
      y: snapToGridValue(section === 'footer' ? canvasSize.height - 100 : 50),
      width: def.defaultSize.width,
      height: def.defaultSize.height,
      content: '',
      fontSize: type === 'heading' ? 18 : 12,
      textAlign: 'left',
      textColor: '#000000',
      bold: false,
      italic: false,
      bgColor: 'transparent',
      borderColor: '#cccccc',
      borderWidth: 1,
      lineColor: '#cccccc',
      lineWidth: 2,
      section: section,
      imageData: null,
      page: currentPageIndex
    };

    setComponents([...components, newComponent]);
    setSelectedId(newComponent.id);
    toast.success(`Added ${def.label}`);
  };

  // Update component
  const updateComponent = (id, updates) => {
    setComponents(components.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  // Delete component
  const deleteComponent = (id) => {
    setComponents(components.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
    toast.success('Component deleted');
  };

  // Duplicate component
  const duplicateComponent = (id) => {
    const comp = components.find(c => c.id === id);
    if (!comp) return;

    const newComp = {
      ...comp,
      id: generateId(),
      x: comp.x + 20,
      y: comp.y + 20
    };
    setComponents([...components, newComp]);
    setSelectedId(newComp.id);
    toast.success('Component duplicated');
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (imageUploadTarget) {
        updateComponent(imageUploadTarget, { imageData: event.target.result });
        toast.success('Image uploaded');
      }
      setImageUploadTarget(null);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    e.target.value = '';
  };

  // Trigger image upload dialog
  const triggerImageUpload = (componentId) => {
    setImageUploadTarget(componentId);
    fileInputRef.current?.click();
  };

  // Save template
  const handleSave = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    // Flatten all pages' components with page index
    const allElements = pages.flatMap((page, pageIndex) => 
      page.components.map(c => ({
        ...c,
        page: pageIndex,
        xPercent: (c.x / canvasSize.width) * 100,
        yPercent: (c.y / canvasSize.height) * 100,
        widthPercent: (c.width / canvasSize.width) * 100,
        heightPercent: (c.height / canvasSize.height) * 100
      }))
    );

    const templateData = {
      template_name: templateName,
      description: templateDescription,
      orientation,
      canvas_width: canvasSize.width,
      canvas_height: canvasSize.height,
      total_pages: pages.length,
      pages: pages.map((page, idx) => ({
        id: page.id,
        page_number: idx + 1,
        components: page.components.map(c => ({
          ...c,
          xPercent: (c.x / canvasSize.width) * 100,
          yPercent: (c.y / canvasSize.height) * 100,
          widthPercent: (c.width / canvasSize.width) * 100,
          heightPercent: (c.height / canvasSize.height) * 100
        }))
      })),
      elements: allElements // Keep flat structure for backwards compatibility
    };

    if (onSave) {
      onSave(templateData);
    } else {
      toast.error('Save handler not configured');
    }
  };

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    for (let x = 0; x <= canvasSize.width; x += GRID_SIZE) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasSize.height}
          stroke="#e5e7eb"
          strokeWidth={x % 50 === 0 ? 0.5 : 0.2}
        />
      );
    }
    for (let y = 0; y <= canvasSize.height; y += GRID_SIZE) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={canvasSize.width}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth={y % 50 === 0 ? 0.5 : 0.2}
        />
      );
    }
    return (
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
        {lines}
      </svg>
    );
  };

  // Render header/footer zones
  const renderZones = () => {
    return (
      <>
        {/* Header Zone */}
        <div 
          className="absolute left-0 right-0 top-0 border-b-2 border-dashed border-blue-300 bg-blue-50/30 pointer-events-none"
          style={{ height: HEADER_ZONE_HEIGHT * zoom }}
        >
          <div className="absolute bottom-1 left-2 text-[10px] text-blue-400 flex items-center gap-1">
            <PanelTop className="w-3 h-3" /> Header Zone
          </div>
        </div>
        {/* Footer Zone */}
        <div 
          className="absolute left-0 right-0 bottom-0 border-t-2 border-dashed border-orange-300 bg-orange-50/30 pointer-events-none"
          style={{ height: FOOTER_ZONE_HEIGHT * zoom }}
        >
          <div className="absolute top-1 left-2 text-[10px] text-orange-400 flex items-center gap-1">
            <PanelBottom className="w-3 h-3" /> Footer Zone
          </div>
        </div>
      </>
    );
  };

  // Click outside to deselect
  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedId(null);
      setEditingId(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-48"
          />
          <Separator orientation="vertical" className="h-6" />
          <Select value={orientation} onValueChange={setOrientation}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
            </SelectContent>
          </Select>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Button 
              variant={showGrid ? 'default' : 'outline'} 
              size="icon"
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              <Switch 
                checked={snapToGrid} 
                onCheckedChange={setSnapToGrid}
                id="snap-grid"
              />
              <Label htmlFor="snap-grid" className="text-xs">Snap</Label>
            </div>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setZoom(0.8)}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              if (components.length === 0) {
                toast.error('Add some components to preview');
                return;
              }
              const templateData = {
                template_name: templateName || 'Preview',
                description: templateDescription,
                orientation,
                canvas_width: canvasSize.width,
                canvas_height: canvasSize.height,
                elements: components.map(c => ({
                  ...c,
                  xPercent: (c.x / canvasSize.width) * 100,
                  yPercent: (c.y / canvasSize.height) * 100,
                  widthPercent: (c.width / canvasSize.width) * 100,
                  heightPercent: (c.height / canvasSize.height) * 100
                }))
              };
              previewCanvasPDF(templateData, {}, {});
              toast.success('PDF preview opened in new tab');
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview PDF
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Components */}
        <div className="w-56 bg-white border-r overflow-auto">
          <div className="p-3">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Components
            </h3>
            
            {/* Header Components */}
            <div className="mb-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <PanelTop className="w-3 h-3" /> Header
              </p>
              <div className="space-y-1">
                {COMPONENT_TYPES.filter(c => c.category === 'header').map((comp) => (
                  <Button
                    key={comp.type}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => addComponent(comp.type)}
                  >
                    <comp.icon className={`w-4 h-4 mr-2 ${comp.color}`} />
                    {comp.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Basic Components */}
            <div className="mb-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Basic</p>
              <div className="space-y-1">
                {COMPONENT_TYPES.filter(c => c.category === 'basic').map((comp) => (
                  <Button
                    key={comp.type}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => addComponent(comp.type)}
                  >
                    <comp.icon className={`w-4 h-4 mr-2 ${comp.color}`} />
                    {comp.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Auto-filled Components */}
            <div className="mb-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Auto-filled</p>
              <div className="space-y-1">
                {COMPONENT_TYPES.filter(c => c.category === 'auto').map((comp) => (
                  <Button
                    key={comp.type}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => addComponent(comp.type)}
                  >
                    <comp.icon className={`w-4 h-4 mr-2 ${comp.color}`} />
                    {comp.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Media Components */}
            <div className="mb-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Media</p>
              <div className="space-y-1">
                {COMPONENT_TYPES.filter(c => c.category === 'media').map((comp) => (
                  <Button
                    key={comp.type}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => addComponent(comp.type)}
                  >
                    <comp.icon className={`w-4 h-4 mr-2 ${comp.color}`} />
                    {comp.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Footer Components */}
            <div className="mb-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <PanelBottom className="w-3 h-3" /> Footer
              </p>
              <div className="space-y-1">
                {COMPONENT_TYPES.filter(c => c.category === 'footer').map((comp) => (
                  <Button
                    key={comp.type}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => addComponent(comp.type)}
                  >
                    <comp.icon className={`w-4 h-4 mr-2 ${comp.color}`} />
                    {comp.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-200 p-8" onClick={handleCanvasClick}>
          <div
            ref={canvasRef}
            className="bg-white shadow-lg mx-auto relative"
            style={{
              width: canvasSize.width * zoom,
              height: canvasSize.height * zoom,
              transformOrigin: 'top left'
            }}
          >
            {renderGrid()}
            {renderZones()}

            {/* Components */}
            {components.map((comp) => (
              <Rnd
                key={comp.id}
                size={{ width: comp.width * zoom, height: comp.height * zoom }}
                position={{ x: comp.x * zoom, y: comp.y * zoom }}
                onDragStop={(e, d) => {
                  updateComponent(comp.id, {
                    x: snapToGridValue(d.x / zoom),
                    y: snapToGridValue(d.y / zoom)
                  });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  updateComponent(comp.id, {
                    width: snapToGridValue(parseInt(ref.style.width) / zoom),
                    height: snapToGridValue(parseInt(ref.style.height) / zoom),
                    x: snapToGridValue(position.x / zoom),
                    y: snapToGridValue(position.y / zoom)
                  });
                }}
                bounds="parent"
                enableResizing={{
                  top: true,
                  right: true,
                  bottom: true,
                  left: true,
                  topRight: true,
                  bottomRight: true,
                  bottomLeft: true,
                  topLeft: true
                }}
                resizeHandleStyles={{
                  topLeft: { 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    backgroundColor: '#3b82f6', border: '2px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    top: '-5px', left: '-5px', cursor: 'nw-resize'
                  },
                  topRight: { 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    backgroundColor: '#3b82f6', border: '2px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    top: '-5px', right: '-5px', cursor: 'ne-resize'
                  },
                  bottomLeft: { 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    backgroundColor: '#3b82f6', border: '2px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    bottom: '-5px', left: '-5px', cursor: 'sw-resize'
                  },
                  bottomRight: { 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    backgroundColor: '#3b82f6', border: '2px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    bottom: '-5px', right: '-5px', cursor: 'se-resize'
                  },
                  top: { 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    backgroundColor: '#3b82f6', border: '2px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    top: '-5px', left: '50%', marginLeft: '-5px', cursor: 'n-resize'
                  },
                  right: { 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    backgroundColor: '#3b82f6', border: '2px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    right: '-5px', top: '50%', marginTop: '-5px', cursor: 'e-resize'
                  },
                  bottom: { 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    backgroundColor: '#3b82f6', border: '2px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    bottom: '-5px', left: '50%', marginLeft: '-5px', cursor: 's-resize'
                  },
                  left: { 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    backgroundColor: '#3b82f6', border: '2px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    left: '-5px', top: '50%', marginTop: '-5px', cursor: 'w-resize'
                  }
                }}
              >
                <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                  <div style={{ width: comp.width, height: comp.height }} className="relative group">
                    <CanvasComponent
                      component={comp}
                      isSelected={selectedId === comp.id}
                      isEditing={editingId === comp.id}
                      onSelect={() => setSelectedId(comp.id)}
                      onDoubleClick={() => {
                        const def = getComponentDef(comp.type);
                        if (def?.supportsInlineEdit) {
                          setEditingId(comp.id);
                        }
                      }}
                      onContentChange={(content) => updateComponent(comp.id, { content })}
                      onImageClick={() => {
                        const def = getComponentDef(comp.type);
                        if (def?.supportsImage) {
                          triggerImageUpload(comp.id);
                        }
                      }}
                      pages={pages}
                    />
                    {/* Floating action buttons - shown when selected */}
                    {selectedId === comp.id && (
                      <div className="absolute -top-8 right-0 flex gap-1 bg-white rounded shadow-lg border p-1 z-50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-blue-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateComponent(comp.id);
                          }}
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteComponent(comp.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Rnd>
            ))}

            {/* Empty state */}
            {components.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Layers className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Drag components here</p>
                  <p className="text-sm">or click a component from the left panel</p>
                </div>
              </div>
            )}
          </div>

          {/* Page Navigation Bar */}
          <div className="flex items-center justify-center gap-2 py-3 bg-gray-100 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPageIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {pages.map((page, idx) => (
                <Button
                  key={page.id}
                  variant={idx === currentPageIndex ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCurrentPageIndex(idx);
                    setSelectedId(null);
                  }}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {idx + 1}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPageIndex === pages.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={addPage}
              className="h-8 gap-1 text-xs"
              title="Add Page"
            >
              <FilePlus className="w-3.5 h-3.5" />
              Add Page
            </Button>
            
            {pages.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={deletePage}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete Current Page"
              >
                <FileX className="w-3.5 h-3.5" />
              </Button>
            )}
            
            <span className="text-xs text-muted-foreground ml-2">
              Page {currentPageIndex + 1} of {pages.length}
            </span>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-64 bg-white border-l overflow-auto">
          <div className="p-3">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              Properties
            </h3>

            {selectedComponent ? (
              <div className="space-y-4">
                {/* Component Info */}
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">Selected</p>
                  <p className="font-medium text-sm">
                    {getComponentDef(selectedComponent.type)?.label}
                  </p>
                </div>

                {/* Section Assignment */}
                <div>
                  <Label className="text-xs">Page Section</Label>
                  <Select 
                    value={selectedComponent.section || 'body'} 
                    onValueChange={(value) => updateComponent(selectedId, { section: value })}
                  >
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">
                        <span className="flex items-center gap-2">
                          <PanelTop className="w-3 h-3 text-blue-500" />
                          Header (repeats on all pages)
                        </span>
                      </SelectItem>
                      <SelectItem value="body">
                        <span className="flex items-center gap-2">
                          <Square className="w-3 h-3 text-gray-500" />
                          Body (main content)
                        </span>
                      </SelectItem>
                      <SelectItem value="footer">
                        <span className="flex items-center gap-2">
                          <PanelBottom className="w-3 h-3 text-orange-500" />
                          Footer (repeats on all pages)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Header/Footer elements appear on every page
                  </p>
                </div>

                <Separator />

                {/* Position */}
                <div>
                  <Label className="text-xs">Position</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-[10px] text-gray-500">X</span>
                      <Input
                        type="number"
                        value={Math.round(selectedComponent.x)}
                        onChange={(e) => updateComponent(selectedId, { x: parseInt(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500">Y</span>
                      <Input
                        type="number"
                        value={Math.round(selectedComponent.y)}
                        onChange={(e) => updateComponent(selectedId, { y: parseInt(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Size */}
                <div>
                  <Label className="text-xs">Size</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-[10px] text-gray-500">Width</span>
                      <Input
                        type="number"
                        value={Math.round(selectedComponent.width)}
                        onChange={(e) => updateComponent(selectedId, { width: parseInt(e.target.value) || 50 })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500">Height</span>
                      <Input
                        type="number"
                        value={Math.round(selectedComponent.height)}
                        onChange={(e) => updateComponent(selectedId, { height: parseInt(e.target.value) || 30 })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Image upload for logo/image components */}
                {['logo', 'image_placeholder'].includes(selectedComponent.type) && (
                  <>
                    <div>
                      <Label className="text-xs">Image</Label>
                      <div className="mt-1 space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => triggerImageUpload(selectedId)}
                        >
                          <Upload className="w-3 h-3 mr-2" />
                          {selectedComponent.imageData ? 'Change Image' : 'Upload Image'}
                        </Button>
                        {selectedComponent.imageData && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs text-red-600 hover:text-red-700"
                            onClick={() => updateComponent(selectedId, { imageData: null })}
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Remove Image
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Max size: 2MB. Supported: PNG, JPG, GIF
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Text-specific properties */}
                {['text', 'heading'].includes(selectedComponent.type) && (
                  <>
                    <div>
                      <Label className="text-xs flex items-center justify-between">
                        Content
                        <span className="text-[10px] text-blue-500 font-normal">
                          Double-click on canvas to edit
                        </span>
                      </Label>
                      <Textarea
                        value={selectedComponent.content || ''}
                        onChange={(e) => updateComponent(selectedId, { content: e.target.value })}
                        className="mt-1 text-xs h-20"
                        placeholder="Enter text..."
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Font Size</Label>
                      <Input
                        type="number"
                        value={selectedComponent.fontSize || 12}
                        onChange={(e) => updateComponent(selectedId, { fontSize: parseInt(e.target.value) || 12 })}
                        className="mt-1 h-8 text-xs"
                        min={8}
                        max={72}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Text Align</Label>
                      <div className="flex gap-1 mt-1">
                        <Button
                          variant={selectedComponent.textAlign === 'left' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateComponent(selectedId, { textAlign: 'left' })}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedComponent.textAlign === 'center' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateComponent(selectedId, { textAlign: 'center' })}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedComponent.textAlign === 'right' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateComponent(selectedId, { textAlign: 'right' })}
                        >
                          <AlignRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Style</Label>
                      <div className="flex gap-1 mt-1">
                        <Button
                          variant={selectedComponent.bold ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateComponent(selectedId, { bold: !selectedComponent.bold })}
                        >
                          <Bold className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedComponent.italic ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateComponent(selectedId, { italic: !selectedComponent.italic })}
                        >
                          <Italic className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Text Color</Label>
                      <Input
                        type="color"
                        value={selectedComponent.textColor || '#000000'}
                        onChange={(e) => updateComponent(selectedId, { textColor: e.target.value })}
                        className="mt-1 h-8 w-full"
                      />
                    </div>
                  </>
                )}

                {/* Divider properties */}
                {selectedComponent.type === 'divider' && (
                  <>
                    <div>
                      <Label className="text-xs">Line Width</Label>
                      <Input
                        type="number"
                        value={selectedComponent.lineWidth || 2}
                        onChange={(e) => updateComponent(selectedId, { lineWidth: parseInt(e.target.value) || 2 })}
                        className="mt-1 h-8 text-xs"
                        min={1}
                        max={10}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Line Color</Label>
                      <Input
                        type="color"
                        value={selectedComponent.lineColor || '#cccccc'}
                        onChange={(e) => updateComponent(selectedId, { lineColor: e.target.value })}
                        className="mt-1 h-8 w-full"
                      />
                    </div>
                  </>
                )}

                {/* Box properties */}
                {selectedComponent.type === 'box' && (
                  <>
                    <div>
                      <Label className="text-xs">Background</Label>
                      <Input
                        type="color"
                        value={selectedComponent.bgColor || '#ffffff'}
                        onChange={(e) => updateComponent(selectedId, { bgColor: e.target.value })}
                        className="mt-1 h-8 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Border Color</Label>
                      <Input
                        type="color"
                        value={selectedComponent.borderColor || '#cccccc'}
                        onChange={(e) => updateComponent(selectedId, { borderColor: e.target.value })}
                        className="mt-1 h-8 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Border Width</Label>
                      <Input
                        type="number"
                        value={selectedComponent.borderWidth || 1}
                        onChange={(e) => updateComponent(selectedId, { borderWidth: parseInt(e.target.value) || 1 })}
                        className="mt-1 h-8 text-xs"
                        min={0}
                        max={10}
                      />
                    </div>
                  </>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => duplicateComponent(selectedId)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deleteComponent(selectedId)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Move className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a component</p>
                <p className="text-xs">to edit its properties</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasTemplateDesigner;
