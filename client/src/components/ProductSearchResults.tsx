import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Package, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProductSearchResultsProps {
  searchTerm: string;
  clientId: string;
  onProductAdded: () => void;
}

export function ProductSearchResults({ searchTerm, clientId, onProductAdded }: ProductSearchResultsProps) {
  const { data: productsData = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: bundlesData = [] } = useQuery({
    queryKey: ["/api/product-bundles"],
  });

  const { toast } = useToast();

  const addProductMutation = useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      const response = await apiRequest('POST', `/api/clients/${clientId}/products`, { productId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product added",
        variant: "default",
        description: "Product has been successfully added to client",
      });
      onProductAdded();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to client",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = (productsData || []).filter((product: any) =>
    product?.name?.toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  const filteredBundles = (bundlesData || []).filter((bundle: any) =>
    bundle?.name?.toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  const allResults = [
    ...filteredProducts.map((item: any) => ({ ...item, type: 'product' })),
    ...filteredBundles.map((item: any) => ({ ...item, type: 'bundle' }))
  ];

  if (allResults.length === 0 && searchTerm) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm">No products or bundles found matching "{searchTerm}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {allResults.map((item: any) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${
              item.type === 'bundle' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {item.type === 'bundle' ? (
                <Archive className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-sm">{item.name}</h4>
              {item.description && (
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.type === 'bundle' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {item.type === 'bundle' ? 'Bundle' : 'Product'}
                </span>
                {item.cost && (
                  <span className="text-xs text-gray-500">Cost: ${item.cost}</span>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => addProductMutation.mutate({ productId: item.id })}
            disabled={addProductMutation.isPending}
          >
            Add
          </Button>
        </div>
      ))}
    </div>
  );
}