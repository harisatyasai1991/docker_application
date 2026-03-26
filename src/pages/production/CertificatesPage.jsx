/**
 * Production Testing Module - Certificates Page
 * View and generate test certificates
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../../components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { 
  FileText, 
  Search, 
  CheckCircle,
  Download,
  Eye,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Plus,
  Package,
  Calendar
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';

export function CertificatesPage({ onLogout }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const generateForUnitId = searchParams.get('unit_id');
  
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [passedUnits, setPassedUnits] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 20;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(!!generateForUnitId);
  const [selectedUnitId, setSelectedUnitId] = useState(generateForUnitId || '');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [viewingCert, setViewingCert] = useState(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await productionAPI.getCertificates({ skip: String(page * limit), limit: String(limit) });
      setCertificates(response.certificates || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchPassedUnits = async () => {
    try {
      // Fetch units that passed but don't have certificates yet
      const response = await productionAPI.getUnits({ test_status: 'passed', limit: '200' });
      const units = response.units || [];
      // Filter out units that already have certificates
      const unitsWithoutCerts = units.filter(u => !u.certificate_id);
      setPassedUnits(unitsWithoutCerts);
    } catch (error) {
      console.error('Error fetching passed units:', error);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchPassedUnits();
  }, [page]);

  const handleGenerateCertificate = async () => {
    if (!selectedUnitId) {
      toast.error('Please select a unit');
      return;
    }

    try {
      setGenerating(true);
      await productionAPI.generateCertificate({
        unit_id: selectedUnitId,
        approval_notes: approvalNotes
      });
      
      toast.success('Certificate generated successfully');
      setShowGenerateDialog(false);
      setSelectedUnitId('');
      setApprovalNotes('');
      fetchCertificates();
      fetchPassedUnits();
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error(error.detail || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const filteredCertificates = searchQuery
    ? certificates.filter(cert => 
        cert.certificate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.unit_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : certificates;

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      <ProductionNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <FileText className="h-8 w-8 text-amber-400" />
              Test Certificates
            </h1>
            <p className="text-muted-foreground mt-1">View and generate test certificates for passed units</p>
          </div>
          <Button 
            className="bg-amber-600 hover:bg-amber-700 text-foreground"
            onClick={() => setShowGenerateDialog(true)}
            disabled={passedUnits.length === 0}
            data-testid="generate-certificate-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Certificate
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted border-border text-foreground"
                data-testid="search-certificates"
              />
            </div>
          </CardContent>
        </Card>

        {/* Certificates Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Certificates Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Generate certificates for units that have passed all tests'}
                </p>
                {!searchQuery && passedUnits.length > 0 && (
                  <Button 
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => setShowGenerateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Certificate
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Certificate No.</TableHead>
                      <TableHead className="text-muted-foreground">Unit ID</TableHead>
                      <TableHead className="text-muted-foreground">Product</TableHead>
                      <TableHead className="text-muted-foreground">Customer</TableHead>
                      <TableHead className="text-muted-foreground">Issued Date</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.map((cert) => (
                      <TableRow 
                        key={cert.certificate_id} 
                        className="border-border hover:bg-muted/50"
                        data-testid={`cert-row-${cert.certificate_id}`}
                      >
                        <TableCell className="font-mono text-foreground">{cert.certificate_number}</TableCell>
                        <TableCell className="text-foreground/80 font-mono">{cert.unit_id}</TableCell>
                        <TableCell className="text-foreground/80">{cert.unit_details?.product_name}</TableCell>
                        <TableCell className="text-muted-foreground">{cert.unit_details?.customer_name || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(cert.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {cert.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setViewingCert(cert)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="border-border text-foreground/80"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-muted-foreground text-sm">
                        Page {page + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="border-border text-foreground/80"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Units awaiting certificates */}
        {passedUnits.length > 0 && (
          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-green-400" />
                Units Awaiting Certificates
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {passedUnits.length} units have passed all tests and are ready for certification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {passedUnits.slice(0, 10).map(unit => (
                  <Badge 
                    key={unit.unit_id}
                    variant="outline" 
                    className="bg-green-500/10 text-green-400 border-green-500/30 cursor-pointer hover:bg-green-500/20"
                    onClick={() => {
                      setSelectedUnitId(unit.unit_id);
                      setShowGenerateDialog(true);
                    }}
                  >
                    {unit.unit_id}
                  </Badge>
                ))}
                {passedUnits.length > 10 && (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    +{passedUnits.length - 10} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Generate Certificate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-400" />
              Generate Certificate
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Generate a test certificate for a passed production unit
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Unit</Label>
              <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Select a passed unit..." />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border max-h-60">
                  {passedUnits.map(unit => (
                    <SelectItem key={unit.unit_id} value={unit.unit_id}>
                      <span className="font-mono">{unit.unit_id}</span>
                      <span className="text-muted-foreground ml-2">- {unit.product_name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Approval Notes (Optional)</Label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any approval notes..."
                className="bg-muted border-border"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowGenerateDialog(false);
                setSelectedUnitId('');
                setApprovalNotes('');
              }}
              className="border-border text-foreground/80"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateCertificate}
              disabled={generating || !selectedUnitId}
              className="bg-amber-600 hover:bg-amber-700"
              data-testid="confirm-generate-cert-btn"
            >
              {generating ? 'Generating...' : 'Generate Certificate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Certificate Dialog */}
      <Dialog open={!!viewingCert} onOpenChange={() => setViewingCert(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-400" />
              Certificate Details
            </DialogTitle>
          </DialogHeader>

          {viewingCert && (
            <div className="space-y-6 py-4">
              {/* Certificate Header */}
              <div className="text-center border-b border-border pb-4">
                <h2 className="text-xl font-bold text-amber-400">TEST CERTIFICATE</h2>
                <p className="text-muted-foreground font-mono mt-1">{viewingCert.certificate_number}</p>
              </div>

              {/* Unit Details */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Unit Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Serial Number</p>
                    <p className="text-foreground font-mono">{viewingCert.unit_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Product</p>
                    <p className="text-foreground">{viewingCert.unit_details?.product_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="text-foreground">{viewingCert.unit_details?.customer_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Manufacturing Date</p>
                    <p className="text-foreground">{formatDate(viewingCert.unit_details?.manufacturing_date)}</p>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Test Results</h3>
                <div className="space-y-2">
                  {viewingCert.test_summary?.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-foreground font-medium">{test.test_name}</p>
                        <p className="text-muted-foreground text-sm">Tested by: {test.tested_by}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={test.result === 'PASS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {test.result}
                        </Badge>
                        {test.value && <p className="text-foreground/80 text-sm mt-1">{test.value}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verdict */}
              <div className="text-center py-4 border-t border-border">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-4 py-1">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {viewingCert.overall_verdict}
                </Badge>
              </div>

              {/* Approval */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Approved by: <span className="text-foreground">{viewingCert.approved_by_name}</span></p>
                <p>Date: <span className="text-foreground">{formatDate(viewingCert.approved_at)}</span></p>
              </div>

              {/* Verification */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
                <QrCode className="h-16 w-16 text-slate-600" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Verification Code</p>
                  <p className="text-foreground font-mono">{viewingCert.verification_code}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setViewingCert(null)}
              className="border-border text-foreground/80"
            >
              Close
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CertificatesPage;
