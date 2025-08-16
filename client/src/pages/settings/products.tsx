import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Package2, Settings, Search, Plus } from "lucide-react";
import BundleManagement from "../bundle-management";

interface Product {
  id: string;
  name: string;
  description?: string;
  cost?: string;
  type: string;
  status: string;
  createdAt: string;
}

interface ProductBundle {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
}

export default function ProductsSettings() {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products & Bundles</h1>
        <p className="text-muted-foreground">
          Manage your products, services, and bundles with recurring task automation
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "products", name: "Products", icon: Package, count: products.length },
            { id: "bundles", name: "Bundles", icon: Package2, count: bundles.length },
            { id: "bundle-management", name: "Bundle Management", icon: Settings, count: 0 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name} {tab.id !== "bundle-management" && `(${tab.count})`}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search Bar (only for products and bundles) */}
      {activeTab !== "bundle-management" && (
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-80"
            />
          </div>
        </div>
      )}

      {/* Products Tab Content */}
      {activeTab === "products" && (
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
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No products created yet
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Cost: ${product.cost || "0.00"}</span>
                          <span>Type: {product.type}</span>
                          <span>Status: {product.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bundles Tab Content */}
      {activeTab === "bundles" && (
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
            ) : bundles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No bundles created yet
              </div>
            ) : (
              <div className="space-y-4">
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{bundle.name}</h3>
                        {bundle.description && (
                          <p className="text-sm text-gray-600 mt-1">{bundle.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Status: {bundle.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bundle Management Tab Content */}
      {activeTab === "bundle-management" && (
        <div className="space-y-6">
          <BundleManagement />
        </div>
      )}
    </div>
  );
}