import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BundleManagement from "../bundle-management";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Package, 
  Edit2, 
  Trash2, 
  DollarSign, 
  Package2,
  ShoppingCart,
  Settings
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  cost?: string;
  type: string;
  categoryId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductBundle {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  products?: BundleProduct[];
  usageCount?: number;
}

interface BundleProduct {
  id: string;
  bundleId: string;
  productId: string;
  quantity: number;
  productName: string;
  productDescription?: string;
  productPrice: string;
  productCost?: string;
  productType: string;
  productStatus: string;
}

export default function ProductsSettings() {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    refetchOnWindowFocus: false,
  });

  // Fetch product bundles
  const { data: bundles = [], isLoading: isLoadingBundles } = useQuery<ProductBundle[]>({
    queryKey: ["/api/product-bundles"],
    refetchOnWindowFocus: false,
  });

  // Filter and sort products
  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField as keyof Product] || '';
      const bValue = b[sortField as keyof Product] || '';
      if (sortOrder === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

  // Filter and sort bundles
  const filteredBundles = bundles
    .filter(bundle => 
      bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bundle.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField as keyof ProductBundle] || '';
      const bValue = b[sortField as keyof ProductBundle] || '';
      if (sortOrder === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products & Bundles</h1>
        <p className="text-muted-foreground">
          Manage your products, services, and bundles with recurring task automation
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="bundles" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            Bundles ({bundles.length})
          </TabsTrigger>
          <TabsTrigger value="bundle-management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Bundle Management
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Search Bar */}
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-80"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Products & Services
              </CardTitle>
              <CardDescription>
                Manage your product and service catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="text-center py-8">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "No products found matching your search" : "No products created yet"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('name')}
                      >
                        Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('type')}
                      >
                        Type {sortField === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('status')}
                      >
                        Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {product.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${product.cost || "0.00"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={product.status === 'active' ? 'default' : 'secondary'}
                          >
                            {product.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-6">
          {/* Search Bar */}
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-80"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="w-5 h-5" />
                Product Bundles
              </CardTitle>
              <CardDescription>
                Manage product bundles for recurring services
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBundles ? (
                <div className="text-center py-8">Loading bundles...</div>
              ) : filteredBundles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "No bundles found matching your search" : "No bundles created yet"}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBundles.map((bundle) => (
                    <Card key={bundle.id} className="border">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{bundle.name}</h3>
                              <Badge 
                                variant={bundle.status === 'active' ? 'default' : 'secondary'}
                              >
                                {bundle.status}
                              </Badge>
                            </div>
                            {bundle.description && (
                              <p className="text-sm text-gray-600 mt-2">{bundle.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              Active Clients: {bundle.usageCount || 0}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      {bundle.products && bundle.products.length > 0 && (
                        <CardContent>
                          <h4 className="font-medium text-gray-900 mb-3">Included Products</h4>
                          <div className="space-y-2">
                            {bundle.products.map((product) => (
                              <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-3">
                                  <ShoppingCart className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <span className="font-medium">{product.productName}</span>
                                    <span className="text-sm text-gray-500 ml-2">
                                      1 unit each
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm font-medium text-blue-600">
                                  ${parseFloat(product.productCost || '0').toFixed(2)} cost
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bundle Management Tab */}
        <TabsContent value="bundle-management" className="space-y-6">
          <BundleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}