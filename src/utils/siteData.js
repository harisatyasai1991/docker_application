// Site data for company-wide overview

export const getSiteData = () => {
  return [
    {
      siteId: 'SITE-001',
      siteName: 'Manufacturing Plant A',
      location: 'Delhi, India',
      region: 'North',
      coordinates: { lat: 28.6139, lng: 77.2090 },
      siteIncharge: {
        name: 'Rajesh Kumar',
        designation: 'Site Manager',
        phone: '+91-98765-43210',
        email: 'rajesh.kumar@company.com'
      },
      totalAssets: 95,
      assetBreakdown: {
        transformer: 15,
        switchgear: 10,
        motors: 28,
        generators: 8,
        cables: 30,
        ups: 4
      },
      healthScore: 78,
      status: 'warning', // healthy, warning, critical
      criticalAlerts: 3,
      warningAlerts: 8,
      lastUpdated: '2024-01-29T10:30:00'
    },
    {
      siteId: 'SITE-002',
      siteName: 'Power Station E',
      location: 'Chennai, India',
      region: 'South',
      coordinates: { lat: 13.0827, lng: 80.2707 },
      siteIncharge: {
        name: 'Priya Sharma',
        designation: 'Operations Head',
        phone: '+91-98765-43211',
        email: 'priya.sharma@company.com'
      },
      totalAssets: 120,
      assetBreakdown: {
        transformer: 25,
        switchgear: 15,
        motors: 35,
        generators: 12,
        cables: 28,
        ups: 5
      },
      healthScore: 92,
      status: 'healthy',
      criticalAlerts: 0,
      warningAlerts: 2,
      lastUpdated: '2024-01-29T10:25:00'
    },
    {
      siteId: 'SITE-003',
      siteName: 'Industrial Complex D',
      location: 'Kolkata, India',
      region: 'East',
      coordinates: { lat: 22.5726, lng: 88.3639 },
      siteIncharge: {
        name: 'Amit Banerjee',
        designation: 'Plant Manager',
        phone: '+91-98765-43212',
        email: 'amit.banerjee@company.com'
      },
      totalAssets: 68,
      assetBreakdown: {
        transformer: 10,
        switchgear: 8,
        motors: 18,
        generators: 6,
        cables: 22,
        ups: 4
      },
      healthScore: 85,
      status: 'healthy',
      criticalAlerts: 1,
      warningAlerts: 4,
      lastUpdated: '2024-01-29T10:28:00'
    },
    {
      siteId: 'SITE-004',
      siteName: 'Processing Facility B',
      location: 'Mumbai, India',
      region: 'West',
      coordinates: { lat: 19.0760, lng: 72.8777 },
      siteIncharge: {
        name: 'Sunita Patel',
        designation: 'Facility Manager',
        phone: '+91-98765-43213',
        email: 'sunita.patel@company.com'
      },
      totalAssets: 80,
      assetBreakdown: {
        transformer: 12,
        switchgear: 10,
        motors: 25,
        generators: 8,
        cables: 20,
        ups: 5
      },
      healthScore: 65,
      status: 'critical',
      criticalAlerts: 6,
      warningAlerts: 12,
      lastUpdated: '2024-01-29T10:20:00'
    },
    {
      siteId: 'SITE-005',
      siteName: 'Distribution Center C',
      location: 'Nagpur, India',
      region: 'Central',
      coordinates: { lat: 21.1458, lng: 79.0882 },
      siteIncharge: {
        name: 'Vikram Singh',
        designation: 'Distribution Manager',
        phone: '+91-98765-43214',
        email: 'vikram.singh@company.com'
      },
      totalAssets: 52,
      assetBreakdown: {
        transformer: 8,
        switchgear: 6,
        motors: 15,
        generators: 5,
        cables: 15,
        ups: 3
      },
      healthScore: 88,
      status: 'healthy',
      criticalAlerts: 0,
      warningAlerts: 3,
      lastUpdated: '2024-01-29T10:32:00'
    }
  ];
};

export const getCompanyStats = () => {
  const sites = getSiteData();
  
  const totalAssets = sites.reduce((sum, site) => sum + site.totalAssets, 0);
  const avgHealthScore = Math.round(
    sites.reduce((sum, site) => sum + site.healthScore, 0) / sites.length
  );
  const totalCriticalAlerts = sites.reduce((sum, site) => sum + site.criticalAlerts, 0);
  const totalWarningAlerts = sites.reduce((sum, site) => sum + site.warningAlerts, 0);
  const healthySites = sites.filter(site => site.status === 'healthy').length;
  const warningSites = sites.filter(site => site.status === 'warning').length;
  const criticalSites = sites.filter(site => site.status === 'critical').length;

  return {
    totalSites: sites.length,
    totalAssets,
    avgHealthScore,
    totalCriticalAlerts,
    totalWarningAlerts,
    healthySites,
    warningSites,
    criticalSites,
    operationalSites: sites.length // Assuming all sites are operational
  };
};

export const getSiteById = (siteId) => {
  const sites = getSiteData();
  return sites.find(site => site.siteId === siteId);
};

export const getRegionColor = (region) => {
  const colors = {
    North: '#3b82f6', // blue
    South: '#10b981', // green
    East: '#f59e0b', // orange
    West: '#8b5cf6', // purple
    Central: '#ec4899' // pink
  };
  return colors[region] || '#6b7280';
};
