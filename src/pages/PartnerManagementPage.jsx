import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Users,
  Link2,
  Unlink,
  Crown,
  Briefcase,
  Store,
  Edit,
  Save,
  Info,
  CheckCircle2,
  XCircle,
  Globe,
} from 'lucide-react';
import { companyAPI, partnerAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/AppHeader';

export const PartnerManagementPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { isMaster } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('companies');
  
  // Edit dialogs
  const [editTypeDialogOpen, setEditTypeDialogOpen] = useState(false);
  const [linkPartnersDialogOpen, setLinkPartnersDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedType, setSelectedType] = useState('customer');
  const [selectedPartnerIds, setSelectedPartnerIds] = useState([]);

  const apiBase = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    if (!isMaster()) {
      toast.error('Access denied. Master Admin privileges required.');
      navigate('/');
    } else {
      loadData();
    }
  }, [isMaster, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesData, partnersData] = await Promise.all([
        companyAPI.getAll(),
        partnerAPI.getAll()
      ]);
      setCompanies(companiesData);
      setPartners(partnersData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTypeClick = (company) => {
    setSelectedCompany(company);
    setSelectedType(company.company_type || 'customer');
    setEditTypeDialogOpen(true);
  };

  const handleLinkPartnersClick = async (company) => {
    setSelectedCompany(company);
    try {
      const linkedPartners = await partnerAPI.getCustomerPartners(company.company_id);
      setSelectedPartnerIds(linkedPartners.map(p => p.company_id));
    } catch (error) {
      setSelectedPartnerIds(company.partner_ids || []);
    }
    setLinkPartnersDialogOpen(true);
  };

  const handleSaveType = async () => {
    try {
      setSaving(true);
      await partnerAPI.updateCompanyType(selectedCompany.company_id, selectedType);
      toast.success(`Company type updated to "${selectedType}"`);
      setEditTypeDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update company type');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePartnerLinks = async () => {
    try {
      setSaving(true);
      await partnerAPI.updateCustomerPartners(selectedCompany.company_id, selectedPartnerIds);
      toast.success('Partner links updated successfully');
      setLinkPartnersDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update partner links');
    } finally {
      setSaving(false);
    }
  };

  const togglePartnerSelection = (partnerId) => {
    setSelectedPartnerIds(prev => 
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'master': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'partner': return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'customer': return <Store className="w-4 h-4 text-green-500" />;
      default: return <Building2 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      master: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      partner: 'bg-blue-100 text-blue-800 border-blue-300',
      customer: 'bg-green-100 text-green-800 border-green-300',
    };
    return (
      <Badge className={`${colors[type] || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
        {getTypeIcon(type)}
        {type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader onLogout={onLogout} />
      
      {/* Page Title */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin-tools')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Partner & Customer Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Configure company types and partner-customer relationships
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Partner-Customer Model</p>
                <p className="mb-2">
                  <strong>Partners</strong> (like IPEC, Acumen) are white-label resellers with their own subdomains. 
                  <strong>Customers</strong> (like BPCL, Tata Power) are end-users who access their own asset data.
                </p>
                <p>
                  When a customer is linked to a partner and logs in via that partner's subdomain (e.g., <code className="bg-blue-100 px-1 rounded">ipec.dmsinsight.com</code>), 
                  they will see the partner's branding while accessing their own company's assets.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              All Companies
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Partners ({partners.length})
            </TabsTrigger>
          </TabsList>

          {/* All Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Company Configuration</CardTitle>
                <CardDescription>
                  Set company types and manage partner-customer relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subdomain</TableHead>
                      <TableHead>Linked Partners</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.company_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {company.logo_url && (
                              <img 
                                src={company.logo_url.startsWith('http') ? company.logo_url : `${apiBase}${company.logo_url}`}
                                alt={company.company_name}
                                className="h-8 w-8 object-contain bg-gray-100 rounded p-1"
                              />
                            )}
                            <div>
                              <p className="font-medium">{company.company_name}</p>
                              <p className="text-xs text-muted-foreground">{company.company_code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(company.company_type)}
                        </TableCell>
                        <TableCell>
                          {company.subdomain ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1 w-fit">
                              <Globe className="w-3 h-3" />
                              {company.subdomain}.dmsinsight.com
                            </code>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.company_type === 'customer' ? (
                            company.partner_ids && company.partner_ids.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {company.partner_ids.map(pid => {
                                  const partner = partners.find(p => p.company_id === pid);
                                  return partner ? (
                                    <Badge key={pid} variant="outline" className="text-xs">
                                      {partner.company_name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No partners linked</span>
                            )
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTypeClick(company)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Type
                            </Button>
                            {company.company_type === 'customer' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLinkPartnersClick(company)}
                              >
                                <Link2 className="w-4 h-4 mr-1" />
                                Link Partners
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Partners Tab */}
          <TabsContent value="partners">
            <Card>
              <CardHeader>
                <CardTitle>Partner Overview</CardTitle>
                <CardDescription>
                  View partners and their linked customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partners.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No partners configured yet.</p>
                    <p className="text-sm">Change a company's type to "Partner" in the All Companies tab.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {partners.map((partner) => (
                      <Card key={partner.company_id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {partner.logo_url && (
                                <img 
                                  src={partner.logo_url.startsWith('http') ? partner.logo_url : `${apiBase}${partner.logo_url}`}
                                  alt={partner.company_name}
                                  className="h-12 w-12 object-contain bg-gray-100 rounded p-1"
                                />
                              )}
                              <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                  {partner.company_name}
                                  {getTypeBadge('partner')}
                                </h3>
                                {partner.subdomain && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {partner.subdomain}.dmsinsight.com
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600">{partner.customer_count || 0}</p>
                              <p className="text-xs text-muted-foreground">Linked Customers</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Type Dialog */}
      <Dialog open={editTypeDialogOpen} onOpenChange={setEditTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Company Type</DialogTitle>
            <DialogDescription>
              Set the role for {selectedCompany?.company_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-green-500" />
                      Customer - End user with their own assets
                    </div>
                  </SelectItem>
                  <SelectItem value="partner">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-500" />
                      Partner - White-label reseller with subdomain
                    </div>
                  </SelectItem>
                  <SelectItem value="master">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Master - Platform owner (DMS Insight)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              {selectedType === 'partner' && (
                <p><strong>Partner:</strong> Can have a custom subdomain and branding. Customers can be linked to this partner to see partner branding when logging in via the partner's subdomain.</p>
              )}
              {selectedType === 'customer' && (
                <p><strong>Customer:</strong> Regular company with their own users and assets. Can be linked to one or more partners for white-labeled access.</p>
              )}
              {selectedType === 'master' && (
                <p><strong>Master:</strong> Reserved for DMS Insight platform administrators. Has full access to all features and data.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTypeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveType} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Partners Dialog */}
      <Dialog open={linkPartnersDialogOpen} onOpenChange={setLinkPartnersDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Link Partners to {selectedCompany?.company_name}
            </DialogTitle>
            <DialogDescription>
              Select which partners this customer can access via their branded portals
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {partners.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No partners available. Create a partner first by changing a company's type to "Partner".</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {partners.map((partner) => (
                  <div 
                    key={partner.company_id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPartnerIds.includes(partner.company_id) 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => togglePartnerSelection(partner.company_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedPartnerIds.includes(partner.company_id)}
                        onCheckedChange={() => togglePartnerSelection(partner.company_id)}
                      />
                      {partner.logo_url && (
                        <img 
                          src={partner.logo_url.startsWith('http') ? partner.logo_url : `${apiBase}${partner.logo_url}`}
                          alt={partner.company_name}
                          className="h-8 w-8 object-contain bg-gray-100 rounded p-1"
                        />
                      )}
                      <div>
                        <p className="font-medium">{partner.company_name}</p>
                        {partner.subdomain && (
                          <p className="text-xs text-muted-foreground">{partner.subdomain}.dmsinsight.com</p>
                        )}
                      </div>
                    </div>
                    {selectedPartnerIds.includes(partner.company_id) ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p className="text-muted-foreground">
                <strong>Selected:</strong> {selectedPartnerIds.length} partner(s)
              </p>
              <p className="text-xs mt-1">
                When this customer logs in via a linked partner's subdomain, they will see the partner's branding.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkPartnersDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePartnerLinks} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Links'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerManagementPage;
