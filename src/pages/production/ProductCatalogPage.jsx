/**
 * Production Testing Module - Product Catalog
 * Manage products and their test requirements
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ProductionNav } from './ProductionNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
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
import { Textarea } from '../../components/ui/textarea';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  ChevronRight,
  Filter,
  Zap,
  Gauge,
  Settings
} from 'lucide-react';
import { productionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

// All available product categories
const ALL_PRODUCT_CATEGORIES = [
  'Cable',
  'Transformer',
  'Motor',
  'Switchgear',
  'Panel',
  'Other'
];

export function ProductCatalogPage({ onLogout }) {
  const navigate = useNavigate();
  const { getModuleConfig, isMaster } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Get allowed categories from module config
  const allowedCategories = useMemo(() => {
    // Master users see all categories
    if (isMaster()) {
      return ALL_PRODUCT_CATEGORIES;
    }
    
    const productionConfig = getModuleConfig('production_testing');
    const configuredCategories = productionConfig?.allowed_categories;
    
    // If no categories configured, show all (default open)
    if (!configuredCategories || configuredCategories.length === 0) {
      return ALL_PRODUCT_CATEGORIES;
    }
    
    return configuredCategories;
  }, [getModuleConfig, isMaster]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [testSpecs, setTestSpecs] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    product_category: 'Cable',
    specifications: {},
    required_tests: [],
    test_sequence: []
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, specsRes] = await Promise.all([
        productionAPI.getProducts(),
        productionAPI.getCategories(),
        productionAPI.getTestSpecs()
      ]);
      
      setProducts(productsRes.products || []);
      setCategories(categoriesRes.categories || []);
      setTestSpecs(specsRes.test_specs || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async () => {
    try {
      if (!formData.product_name || !formData.product_code) {
        toast.error('Product name and code are required');
        return;
      }

      await productionAPI.createProduct(formData);
      toast.success('Product created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error.detail || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async () => {
    try {
      if (!formData.product_name || !formData.product_code) {
        toast.error('Product name and code are required');
        return;
      }

      await productionAPI.updateProduct(editingProduct.product_id, formData);
      toast.success('Product updated successfully');
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.detail || 'Failed to update product');
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: '',
      product_code: '',
      product_category: 'Cable',
      specifications: {},
      required_tests: [],
      test_sequence: []
    });
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      product_code: product.product_code,
      product_category: product.product_category,
      specifications: product.specifications || {},
      required_tests: product.required_tests || [],
      test_sequence: product.test_sequence || []
    });
  };

  const toggleTestSelection = (testCode) => {
    const currentTests = formData.required_tests || [];
    const newTests = currentTests.includes(testCode)
      ? currentTests.filter(t => t !== testCode)
      : [...currentTests, testCode];
    
    setFormData({
      ...formData,
      required_tests: newTests,
      test_sequence: newTests
    });
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.product_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Cable':
        return <Zap className="h-4 w-4" />;
      case 'Transformer':
        return <Settings className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Cable':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Transformer':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Motor':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-muted-foreground border-slate-500/30';
    }
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
              <Package className="h-8 w-8 text-cyan-400" />
              Product Catalog
            </h1>
            <p className="text-muted-foreground mt-1">Manage products and configure test requirements</p>
          </div>
          <Button 
            className="bg-cyan-600 hover:bg-cyan-700 text-foreground"
            onClick={() => setShowCreateDialog(true)}
            data-testid="create-product-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted border-border text-foreground"
                    data-testid="search-products"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] bg-muted border-border text-foreground">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="all">All Categories</SelectItem>
                  {[...new Set([...allowedCategories, ...categories])].map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first product'}
              </p>
              {!searchQuery && selectedCategory === 'all' && (
                <Button 
                  className="bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.product_id} 
                className="bg-card border-border hover:border-cyan-500/30 transition-colors cursor-pointer"
                data-testid={`product-card-${product.product_id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getCategoryColor(product.product_category)}>
                        {getCategoryIcon(product.product_category)}
                        <span className="ml-1">{product.product_category}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(product);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-foreground mt-2">{product.product_name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{product.product_code}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Specifications Preview */}
                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Specifications</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(product.specifications).slice(0, 3).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="bg-muted text-foreground/80 text-xs">
                            {value}
                          </Badge>
                        ))}
                        {Object.keys(product.specifications).length > 3 && (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                            +{Object.keys(product.specifications).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Required Tests */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Required Tests</p>
                    <div className="flex flex-wrap gap-1">
                      {(product.required_tests || []).map((test) => (
                        <Badge 
                          key={test} 
                          variant="outline" 
                          className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs"
                        >
                          <Gauge className="h-3 w-3 mr-1" />
                          {test}
                        </Badge>
                      ))}
                      {(!product.required_tests || product.required_tests.length === 0) && (
                        <span className="text-muted-foreground text-xs">No tests configured</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Product Dialog */}
      <Dialog open={showCreateDialog || !!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingProduct(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingProduct ? 'Update product details and test requirements' : 'Define a new product with its test requirements'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="e.g., 33kV XLPE Power Cable"
                  className="bg-muted border-border"
                  data-testid="input-product-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_code">Product Code *</Label>
                <Input
                  id="product_code"
                  value={formData.product_code}
                  onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                  placeholder="e.g., 33KV-XLPE-AL-3C"
                  className="bg-muted border-border"
                  data-testid="input-product-code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_category">Category</Label>
              <Select 
                value={formData.product_category} 
                onValueChange={(value) => setFormData({ ...formData, product_category: value })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {allowedCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Required Tests Selection */}
            <div className="space-y-2">
              <Label>Required Tests</Label>
              <p className="text-xs text-muted-foreground mb-2">Select tests that must be performed on this product</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {testSpecs.map((spec) => (
                  <div
                    key={spec.test_spec_id}
                    onClick={() => toggleTestSelection(spec.test_code)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.required_tests.includes(spec.test_code)
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-muted border-border text-foreground/80 hover:border-slate-600'
                    }`}
                    data-testid={`test-option-${spec.test_code}`}
                  >
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      <span className="font-medium text-sm">{spec.test_code}</span>
                    </div>
                    <p className="text-xs mt-1 opacity-70">{spec.test_name}</p>
                  </div>
                ))}
                {testSpecs.length === 0 && (
                  <p className="text-muted-foreground text-sm col-span-3">
                    No test specifications found. Create test specs first.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setEditingProduct(null);
                resetForm();
              }}
              className="border-border text-foreground/80"
            >
              Cancel
            </Button>
            <Button 
              onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="save-product-btn"
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProductCatalogPage;
