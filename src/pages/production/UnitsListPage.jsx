/**
 * Production Testing Module - Units List Page
 * View and manage production units
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
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
  Package, 
  Search, 
  CheckCircle,
  XCircle,
  Clock,
  Play,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Gauge
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { toast } from 'sonner';

export function UnitsListPage({ onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('test_status') || 'all');
  const [batchFilter, setBatchFilter] = useState(searchParams.get('batch_id') || 'all');
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const params = {
        skip: String(page * limit),
        limit: String(limit)
      };
      
      if (statusFilter !== 'all') params.test_status = statusFilter;
      if (batchFilter !== 'all') params.batch_id = batchFilter;
      
      const response = await productionAPI.getUnits(params);
      setUnits(response.units || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await productionAPI.getBatches({ limit: '100' });
      setBatches(response.batches || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [page, statusFilter, batchFilter]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('test_status', statusFilter);
    if (batchFilter !== 'all') params.set('batch_id', batchFilter);
    if (searchQuery) params.set('search', searchQuery);
    setSearchParams(params);
  }, [statusFilter, batchFilter, searchQuery]);

  // Filter units by search query (client-side for unit_id search)
  const filteredUnits = searchQuery 
    ? units.filter(unit => unit.unit_id.toLowerCase().includes(searchQuery.toLowerCase()))
    : units;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-slate-500/20 text-muted-foreground border-slate-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'testing':
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Gauge className="h-3 w-3 mr-1" />Testing</Badge>;
      case 'passed':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onLogout={onLogout} />
      <ProductionNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Package className="h-8 w-8 text-cyan-400" />
              Production Units
            </h1>
            <p className="text-muted-foreground mt-1">View and manage production units / serial numbers</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by serial number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted border-border text-foreground"
                    data-testid="search-units"
                  />
                </div>
              </div>
              <Select value={batchFilter} onValueChange={(value) => { setBatchFilter(value); setPage(0); }}>
                <SelectTrigger className="w-[200px] bg-muted border-border text-foreground">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches.map(batch => (
                    <SelectItem key={batch.batch_id} value={batch.batch_id}>
                      {batch.batch_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(0); }}>
                <SelectTrigger className="w-[160px] bg-muted border-border text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Units Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Units Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' || batchFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Register units from a batch to get started'}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Serial Number</TableHead>
                      <TableHead className="text-muted-foreground">Product</TableHead>
                      <TableHead className="text-muted-foreground">Batch</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Tests</TableHead>
                      <TableHead className="text-muted-foreground">Certificate</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit) => (
                      <TableRow 
                        key={unit.unit_id} 
                        className="border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/production/units/${unit.unit_id}`)}
                        data-testid={`unit-row-${unit.unit_id}`}
                      >
                        <TableCell className="font-mono text-foreground">{unit.unit_id}</TableCell>
                        <TableCell className="text-foreground/80">{unit.product_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {batches.find(b => b.batch_id === unit.batch_id)?.batch_number || unit.batch_id}
                        </TableCell>
                        <TableCell>{getStatusBadge(unit.test_status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-green-400">{unit.completed_tests?.length || 0}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{unit.required_tests?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {unit.certificate_number ? (
                            <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              <FileText className="h-3 w-3 mr-1" />
                              {unit.certificate_number}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {(unit.test_status === 'pending' || unit.test_status === 'testing') && (
                              <Button
                                size="sm"
                                onClick={() => navigate(`/production/tests/new?unit_id=${unit.unit_id}`)}
                                className="bg-cyan-600 hover:bg-cyan-700"
                                data-testid={`execute-test-${unit.unit_id}`}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Test
                              </Button>
                            )}
                            {unit.test_status === 'passed' && !unit.certificate_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/production/certificates/generate?unit_id=${unit.unit_id}`)}
                                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Certificate
                              </Button>
                            )}
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
                      Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} units
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
      </main>
    </div>
  );
}

export default UnitsListPage;
