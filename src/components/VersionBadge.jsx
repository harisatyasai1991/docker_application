/**
 * Version Badge Component
 * Displays the application version in the UI
 */
import React, { useState, useEffect } from 'react';
import { versionAPI } from '../services/api';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Info, Calendar, Package, GitBranch, CheckCircle } from 'lucide-react';

export const VersionBadge = ({ showDialog = true, className = '' }) => {
  const [versionInfo, setVersionInfo] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [changelog, setChangelog] = useState('');

  useEffect(() => {
    loadVersionInfo();
  }, []);

  const loadVersionInfo = async () => {
    try {
      const info = await versionAPI.getVersion();
      setVersionInfo(info);
    } catch (error) {
      console.error('Failed to load version info:', error);
      setVersionInfo({ full_version: 'v-unknown', version: 'unknown' });
    }
  };

  const loadChangelog = async () => {
    try {
      const data = await versionAPI.getChangelog();
      setChangelog(data.changelog || '');
    } catch (error) {
      console.error('Failed to load changelog:', error);
      setChangelog('Failed to load changelog');
    }
  };

  const handleClick = () => {
    if (showDialog) {
      loadChangelog();
      setIsDialogOpen(true);
    }
  };

  if (!versionInfo) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${className}`}
        title="Click for version details"
      >
        <Package className="w-3 h-3" />
        <span>{versionInfo.full_version}</span>
      </button>

      {showDialog && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                System Information
              </DialogTitle>
              <DialogDescription>
                Application version and release information
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Version Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Package className="w-4 h-4" />
                    Version
                  </div>
                  <div className="font-semibold text-lg">{versionInfo.full_version}</div>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <GitBranch className="w-4 h-4" />
                    Customer
                  </div>
                  <div className="font-semibold">{versionInfo.customer_name}</div>
                  <div className="text-xs text-muted-foreground">Code: {versionInfo.customer_code}</div>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    Release Date
                  </div>
                  <div className="font-semibold">{versionInfo.release_date || 'N/A'}</div>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CheckCircle className="w-4 h-4" />
                    Release Type
                  </div>
                  <Badge variant={versionInfo.release_type === 'stable' ? 'default' : 'secondary'}>
                    {versionInfo.release_type || 'unknown'}
                  </Badge>
                </div>
              </div>
              
              {/* Modules */}
              {versionInfo.modules && versionInfo.modules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Included Modules</h4>
                  <div className="flex flex-wrap gap-2">
                    {versionInfo.modules.map((module) => (
                      <Badge key={module} variant="outline" className="text-xs">
                        {module.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Features in Release */}
              {versionInfo.features_in_release && versionInfo.features_in_release.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Features in This Release</h4>
                  <ul className="text-sm space-y-1">
                    {versionInfo.features_in_release.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Changelog Preview */}
              {changelog && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Changelog</h4>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-[200px] overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {changelog.slice(0, 2000)}
                      {changelog.length > 2000 && '...\n\n[Truncated - See full changelog for more]'}
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Build Info */}
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Build Date: {versionInfo.build_date}</span>
                  <span>© 2026 DMS Insight</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default VersionBadge;
