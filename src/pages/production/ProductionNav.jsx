/**
 * Production Module Navigation
 * Shared navigation tabs for all production pages with Search on the right
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { GlobalSearch } from '../../components/GlobalSearch';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  ListChecks,
  Gauge,
  FileText,
  Settings,
  Sparkles,
  Search,
  Command,
  Wrench,
  Shield
} from 'lucide-react';

// Regular production nav items (not visible to auditors)
const productionNavItems = [
  { path: '/production', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/production/products', label: 'Products', icon: Package },
  { path: '/production/test-specs', label: 'Test Types', icon: Settings },
  { path: '/production/batches', label: 'Batches', icon: Boxes },
  { path: '/production/units', label: 'Units', icon: ListChecks },
  { path: '/production/equipment', label: 'Equipment', icon: Wrench },
  { path: '/production/tests/new', label: 'Execute Test', icon: Gauge },
  { path: '/production/certificates', label: 'Certificates', icon: FileText },
];

// Audit nav item - only for admin/master/auditor
const auditNavItem = { path: '/production/audit', label: 'Audit', icon: Shield };

// Manager+ only nav items
const managerNavItems = [
  { path: '/production/ai-efficiency', label: 'AI Metrics', icon: Sparkles },
];

export function ProductionNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Check user role for role-based navigation
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userRole = currentUser.role || '';
  const isManager = ['prod_manager', 'admin', 'master'].includes(userRole);
  const isAuditor = userRole === 'auditor';
  const canAccessAudit = ['admin', 'master', 'auditor'].includes(userRole);
  
  // Build nav items based on role
  let allNavItems = [];
  
  if (isAuditor) {
    // Auditors ONLY see the Audit option
    allNavItems = [auditNavItem];
  } else {
    // Other users see production items
    allNavItems = [...productionNavItems];
    
    // Add Audit tab for admin/master only
    if (canAccessAudit) {
      allNavItems.push(auditNavItem);
    }
    
    // Add manager items for managers
    if (isManager) {
      allNavItems.push(...managerNavItems);
    }
  }
  
  const isActive = (path) => {
    if (path === '/production') {
      return location.pathname === '/production';
    }
    return location.pathname.startsWith(path);
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            {/* Left: Navigation Tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto flex-1">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Button
                    key={item.path}
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 whitespace-nowrap ${
                      active 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            {/* Right: Search Button - hide for auditors */}
            {!isAuditor && (
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSearchOpen(true)}
                  className="gap-2 text-muted-foreground hover:text-foreground border-border"
                  data-testid="production-search-btn"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden md:inline text-sm">Search</span>
                  <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <Command className="h-3 w-3" />K
                  </kbd>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

export default ProductionNav;
