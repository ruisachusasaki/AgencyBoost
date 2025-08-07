import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Trash2, DollarSign, Clock, Repeat } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  type: "one_time" | "recurring";
  category: string;
  status: "active" | "inactive";
  createdAt: string;
  usageCount: number;
}

export default function Products() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock products data
  const [products] = useState<Product[]>([
    {
      id: "1",
      name: "SEO Audit",
      description: "Comprehensive website SEO analysis and recommendations",
      price: "497.00",
      type: "one_time",
      category: "SEO Services",
      status: "active",
      createdAt: "2024-01-15",
      usageCount: 8
    },
    {
      id: "2", 
      name: "Monthly Content Creation",
      description: "Monthly blog posts, social media content, and email newsletters",
      price: "2500.00",
      type: "recurring",
      category: "Content Marketing",
      status: "active",
      createdAt: "2024-02-01",
      usageCount: 12
    },
    {
      id: "3",
      name: "Website Design",
      description: "Custom website design and development",
      price: "5000.00", 
      type: "one_time",
      category: "Web Development",
      status: "active",
      createdAt: "2024-03-10",
      usageCount: 3
    },
    {
      id: "4",
      name: "Google Ads Management",
      description: "Monthly Google Ads campaign management and optimization",
      price: "1500.00",
      type: "recurring", 
      category: "Paid Advertising",
      status: "inactive",
      createdAt: "2024-04-05",
      usageCount: 5
    }
  ]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    type: "one_time" as "one_time" | "recurring",
    category: ""
  });

  const categories = [
    "SEO Services",
    "Content Marketing", 
    "Web Development",
    "Paid Advertising",
    "Social Media",
    "Email Marketing",
    "Consulting",
    "Analytics & Reporting"
  ];

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implement API call to add product
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Success",
        description: "Product created successfully.",
      });
      
      setIsAddDialogOpen(false);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        type: "one_time",
        category: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    
    try {
      // TODO: Implement API call to delete product
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(price));
  };

  const activeProducts = products.filter(p => p.status === 'active');
  const inactiveProducts = products.filter(p => p.status === 'inactive');

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              Products & Services
            </h1>
            <p className="text-gray-600 mt-2">Manage your products and services catalog</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Product/Service</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <Label htmlFor="productName">Product/Service Name *</Label>
                  <Input
                    id="productName"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows={3}
                    placeholder="Describe what this product or service includes..."
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        className="pl-10"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={newProduct.type} onValueChange={(value: "one_time" | "recurring") => setNewProduct({...newProduct, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_time">One-time</SelectItem>
                        <SelectItem value="recurring">Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Product"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-primary mr-3" />
                <div>
                  <div className="text-2xl font-bold">{products.length}</div>
                  <div className="text-sm text-gray-600">Total Products</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{products.filter(p => p.type === 'one_time').length}</div>
                  <div className="text-sm text-gray-600">One-time</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Repeat className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{products.filter(p => p.type === 'recurring').length}</div>
                  <div className="text-sm text-gray-600">Recurring</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">
                    {formatPrice(products.reduce((sum, p) => sum + parseFloat(p.price), 0).toString())}
                  </div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Products */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Active Products ({activeProducts.length})</h2>
          <div className="grid gap-4">
            {activeProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <Badge variant={product.type === 'recurring' ? 'default' : 'secondary'}>
                          {product.type === 'recurring' ? (
                            <>
                              <Repeat className="h-3 w-3 mr-1" />
                              Recurring
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />  
                              One-time
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                      
                      {product.description && (
                        <p className="text-gray-600 mb-3">{product.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span className="font-semibold text-green-600">{formatPrice(product.price)}</span>
                        </div>
                        <div>Used {product.usageCount} times</div>
                        <div>Created {product.createdAt}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Inactive Products */}
        {inactiveProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-600">Inactive Products ({inactiveProducts.length})</h2>
            <div className="grid gap-4">
              {inactiveProducts.map((product) => (
                <Card key={product.id} className="opacity-60">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          <Badge variant="secondary">Inactive</Badge>
                          <Badge variant={product.type === 'recurring' ? 'default' : 'secondary'}>
                            {product.type}
                          </Badge>
                        </div>
                        
                        {product.description && (
                          <p className="text-gray-600 mb-3">{product.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatPrice(product.price)}
                          </div>
                          <div>Used {product.usageCount} times</div>
                          <div>Created {product.createdAt}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Access Note */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                <strong>Admin & Accounting Access:</strong> This section is visible to Admins and users with Accounting role.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}