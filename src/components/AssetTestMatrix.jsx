import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Copy,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Layers,
  Zap,
  Grid3X3,
} from 'lucide-react';
import { TestModeBadge } from './TestModeBadge';

/**
 * Asset-Test Matrix Component
 * Provides a grid view for selecting tests for multiple assets
 * with copy, bulk select, and grouping features
 */
export const AssetTestMatrix = ({
  assets = [],
  tests = [],
  selectedTests = {}, // { assetId: [testIds] }
  onSelectionChange,
  getTestsForAssetType = () => tests,
}) => {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedAssetForCopy, setSelectedAssetForCopy] = useState(null);

  // Group assets by type
  const groupedAssets = useMemo(() => {
    const groups = {};
    assets.forEach(asset => {
      const type = asset.asset_type || 'Other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(asset);
    });
    return groups;
  }, [assets]);

  // Get all unique tests across all asset types
  const allTests = useMemo(() => {
    const testMap = new Map();
    assets.forEach(asset => {
      const assetTests = getTestsForAssetType(asset.asset_id);
      assetTests.forEach(test => {
        if (!testMap.has(test.test_id)) {
          testMap.set(test.test_id, test);
        }
      });
    });
    return Array.from(testMap.values());
  }, [assets, getTestsForAssetType]);

  // Initialize expanded groups
  React.useEffect(() => {
    const initial = {};
    Object.keys(groupedAssets).forEach(type => {
      initial[type] = true; // All expanded by default
    });
    setExpandedGroups(initial);
  }, [groupedAssets]);

  // Check if a test is selected for an asset
  const isTestSelected = (assetId, testId) => {
    return (selectedTests[assetId] || []).includes(testId);
  };

  // Check if test is applicable for asset type
  const isTestApplicable = (asset, testId) => {
    const applicableTests = getTestsForAssetType(asset.asset_id);
    return applicableTests.some(t => t.test_id === testId);
  };

  // Toggle single test for single asset
  const toggleTest = (assetId, testId) => {
    const currentTests = selectedTests[assetId] || [];
    const newTests = currentTests.includes(testId)
      ? currentTests.filter(id => id !== testId)
      : [...currentTests, testId];
    
    onSelectionChange({
      ...selectedTests,
      [assetId]: newTests
    });
  };

  // Select all tests for an asset
  const selectAllTestsForAsset = (assetId) => {
    const asset = assets.find(a => a.asset_id === assetId);
    const applicableTests = getTestsForAssetType(assetId);
    
    onSelectionChange({
      ...selectedTests,
      [assetId]: applicableTests.map(t => t.test_id)
    });
    
    toast.success(`Selected all ${applicableTests.length} tests for ${asset?.asset_name || assetId}`);
  };

  // Clear all tests for an asset
  const clearTestsForAsset = (assetId) => {
    const asset = assets.find(a => a.asset_id === assetId);
    onSelectionChange({
      ...selectedTests,
      [assetId]: []
    });
    toast.success(`Cleared tests for ${asset?.asset_name || assetId}`);
  };

  // Select a test for all applicable assets
  const selectTestForAllAssets = (testId) => {
    const test = allTests.find(t => t.test_id === testId);
    const newSelection = { ...selectedTests };
    let count = 0;
    
    assets.forEach(asset => {
      if (isTestApplicable(asset, testId)) {
        const currentTests = newSelection[asset.asset_id] || [];
        if (!currentTests.includes(testId)) {
          newSelection[asset.asset_id] = [...currentTests, testId];
          count++;
        }
      }
    });
    
    onSelectionChange(newSelection);
    toast.success(`Added "${test?.name}" to ${count} assets`);
  };

  // Clear a test from all assets
  const clearTestFromAllAssets = (testId) => {
    const test = allTests.find(t => t.test_id === testId);
    const newSelection = { ...selectedTests };
    
    Object.keys(newSelection).forEach(assetId => {
      newSelection[assetId] = newSelection[assetId].filter(id => id !== testId);
    });
    
    onSelectionChange(newSelection);
    toast.success(`Removed "${test?.name}" from all assets`);
  };

  // Check if a test is selected for all applicable assets
  const isTestSelectedForAllAssets = (testId) => {
    const applicableAssets = assets.filter(asset => isTestApplicable(asset, testId));
    if (applicableAssets.length === 0) return false;
    
    return applicableAssets.every(asset => {
      const assetTests = selectedTests[asset.asset_id] || [];
      return assetTests.includes(testId);
    });
  };

  // Check if a test is selected for some (but not all) applicable assets
  const isTestPartiallySelected = (testId) => {
    const applicableAssets = assets.filter(asset => isTestApplicable(asset, testId));
    if (applicableAssets.length === 0) return false;
    
    const selectedCount = applicableAssets.filter(asset => {
      const assetTests = selectedTests[asset.asset_id] || [];
      return assetTests.includes(testId);
    }).length;
    
    return selectedCount > 0 && selectedCount < applicableAssets.length;
  };

  // Toggle test for all applicable assets (select all if not all selected, clear all if all selected)
  const toggleTestForAllAssets = (testId) => {
    if (isTestSelectedForAllAssets(testId)) {
      clearTestFromAllAssets(testId);
    } else {
      selectTestForAllAssets(testId);
    }
  };

  // Copy tests from one asset to others
  const copyTestsToAssets = (sourceAssetId, targetAssetIds) => {
    const sourceTests = selectedTests[sourceAssetId] || [];
    const sourceAsset = assets.find(a => a.asset_id === sourceAssetId);
    const newSelection = { ...selectedTests };
    let count = 0;
    
    targetAssetIds.forEach(targetId => {
      const targetAsset = assets.find(a => a.asset_id === targetId);
      const applicableTests = getTestsForAssetType(targetId);
      const applicableTestIds = applicableTests.map(t => t.test_id);
      
      // Only copy tests that are applicable to target asset
      const testsToApply = sourceTests.filter(testId => applicableTestIds.includes(testId));
      
      if (testsToApply.length > 0) {
        newSelection[targetId] = [...new Set([...(newSelection[targetId] || []), ...testsToApply])];
        count++;
      }
    });
    
    onSelectionChange(newSelection);
    toast.success(`Copied tests from "${sourceAsset?.asset_name}" to ${count} assets`);
    setSelectedAssetForCopy(null);
  };

  // Copy tests to all assets in same group
  const copyTestsToSameType = (sourceAssetId) => {
    const sourceAsset = assets.find(a => a.asset_id === sourceAssetId);
    const sameTypeAssets = assets.filter(a => 
      a.asset_type === sourceAsset?.asset_type && a.asset_id !== sourceAssetId
    );
    copyTestsToAssets(sourceAssetId, sameTypeAssets.map(a => a.asset_id));
  };

  // Copy tests to all assets
  const copyTestsToAllAssets = (sourceAssetId) => {
    const targetIds = assets.filter(a => a.asset_id !== sourceAssetId).map(a => a.asset_id);
    copyTestsToAssets(sourceAssetId, targetIds);
  };

  // Select ALL tests for ALL assets
  const selectAllTestsForAllAssets = () => {
    const newSelection = {};
    assets.forEach(asset => {
      const applicableTests = getTestsForAssetType(asset.asset_id);
      newSelection[asset.asset_id] = applicableTests.map(t => t.test_id);
    });
    onSelectionChange(newSelection);
    toast.success('Selected all tests for all assets');
  };

  // Clear all selections
  const clearAllSelections = () => {
    const newSelection = {};
    assets.forEach(asset => {
      newSelection[asset.asset_id] = [];
    });
    onSelectionChange(newSelection);
    toast.success('Cleared all test selections');
  };

  // Toggle group expansion
  const toggleGroup = (type) => {
    setExpandedGroups(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Get count of selected tests for an asset
  const getSelectedCount = (assetId) => {
    return (selectedTests[assetId] || []).length;
  };

  // Get total selected count
  const getTotalSelectedCount = () => {
    return Object.values(selectedTests).reduce((sum, tests) => sum + tests.length, 0);
  };

  if (assets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Grid3X3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No assets selected</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Test Configuration Matrix</h3>
            <Badge variant="secondary">
              {getTotalSelectedCount()} tests selected
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllTestsForAllAssets}
              className="gap-1"
            >
              <Zap className="w-4 h-4" />
              Select All Tests
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllSelections}
              className="gap-1 text-muted-foreground"
            >
              <Square className="w-4 h-4" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-medium min-w-[200px] border-r sticky left-0 bg-muted/50 z-10">
                  Asset
                </th>
                {allTests.map(test => {
                  const isAllSelected = isTestSelectedForAllAssets(test.test_id);
                  const isPartial = isTestPartiallySelected(test.test_id);
                  
                  return (
                    <th key={test.test_id} className="p-2 text-center min-w-[100px] border-r">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="space-y-1.5">
                            <div className="font-medium text-xs truncate max-w-[100px]">
                              {test.name}
                            </div>
                            <div className="flex items-center justify-center">
                              <TestModeBadge 
                                mode={test.test_mode || 'offline'} 
                                size="sm" 
                                showLabel={false}
                              />
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <Checkbox
                                checked={isAllSelected}
                                ref={(el) => {
                                  if (el) {
                                    el.indeterminate = isPartial && !isAllSelected;
                                  }
                                }}
                                onCheckedChange={() => toggleTestForAllAssets(test.test_id)}
                                className="mx-auto"
                              />
                              <span className="text-[10px] text-muted-foreground">All</span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{test.name}</p>
                          <p className="text-xs text-muted-foreground">{test.category}</p>
                          <p className="text-xs">Mode: {test.test_mode === 'online' ? 'Online (Live Equipment)' : 'Offline (De-energized)'}</p>
                          <p className="text-xs mt-1">
                            {isAllSelected 
                              ? 'Click to deselect from all assets' 
                              : 'Click to select for all applicable assets'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  );
                })}
                <th className="p-2 text-center min-w-[120px] bg-muted/50">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody>
              {Object.entries(groupedAssets).map(([type, groupAssets]) => (
                <React.Fragment key={type}>
                  {/* Group Header */}
                  <tr className="bg-accent/30">
                    <td 
                      colSpan={allTests.length + 2}
                      className="p-2 cursor-pointer hover:bg-accent/50"
                      onClick={() => toggleGroup(type)}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        {expandedGroups[type] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <Layers className="w-4 h-4 text-primary" />
                        {type}
                        <Badge variant="outline" className="ml-2">
                          {groupAssets.length} assets
                        </Badge>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Group Assets */}
                  {expandedGroups[type] && groupAssets.map(asset => (
                    <tr key={asset.asset_id} className="border-b hover:bg-muted/20">
                      <td className="p-3 border-r sticky left-0 bg-background z-10">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{asset.asset_name || asset.asset_id}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {asset.location || 'No location'}
                            </p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {getSelectedCount(asset.asset_id)}
                          </Badge>
                        </div>
                      </td>
                      
                      {allTests.map(test => {
                        const applicable = isTestApplicable(asset, test.test_id);
                        const selected = isTestSelected(asset.asset_id, test.test_id);
                        
                        return (
                          <td key={test.test_id} className="p-2 text-center border-r">
                            {applicable ? (
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleTest(asset.asset_id, test.test_id)}
                                className="mx-auto"
                              />
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                        );
                      })}
                      
                      <td className="p-2 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8">
                              Actions
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => selectAllTestsForAsset(asset.asset_id)}>
                              <CheckSquare className="w-4 h-4 mr-2" />
                              Select All Tests
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => clearTestsForAsset(asset.asset_id)}>
                              <Square className="w-4 h-4 mr-2" />
                              Clear All Tests
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => copyTestsToSameType(asset.asset_id)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy to Same Type ({type})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyTestsToAllAssets(asset.asset_id)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy to All Assets
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <strong>{assets.length}</strong> assets • <strong>{getTotalSelectedCount()}</strong> test configurations
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Checkbox checked disabled className="w-3 h-3" /> = Selected
            </span>
            <span>• — = Not Applicable</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AssetTestMatrix;
