import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, MoreHorizontal, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Isolated Forms page for testing
export default function FormsTest() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch forms
  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["/api/forms"],
  });

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      return apiRequest(`/api/forms/${formId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        variant: "default",
        description: "Form deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive",
      });
    },
  });

  const handleDeleteForm = (formId: string) => {
    if (window.confirm("Are you sure you want to delete this form?")) {
      deleteFormMutation.mutate(formId);
    }
  };

  const filteredForms = (forms as any[]).filter((form: any) =>
    form.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <FileText className="h-8 w-8 text-[#46a1a0]" />
          <span>Forms Test Page</span>
        </h1>
        <p className="text-muted-foreground">
          Isolated Forms component for debugging
        </p>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
                data-testid="input-search-forms"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              asChild
              className="bg-[#46a1a0] hover:bg-[#3a8b8a] h-10" 
              size="sm"
              data-testid="button-create-form"
            >
              <a href="/form-builder">
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </a>
            </Button>
          </div>
        </div>

        {/* Forms Grid */}
        {filteredForms.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "No forms match your search." : "Get started by creating your first form."}
            </p>
            <Button 
              asChild
              className="bg-[#46a1a0] hover:bg-[#3a8b8a]"
              data-testid="button-create-first-form"
            >
              <a href="/form-builder">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Form
              </a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((form: any) => (
              <Card key={form.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      <CardTitle className="text-sm font-medium truncate">
                        {form.name}
                      </CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`button-form-menu-${form.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/form-builder/${form.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/forms/${form.id}`);
                          toast({
                            title: "Success",
                            variant: "default",
                            description: "Form URL copied to clipboard",
                          });
                        }}>
                          <FileText className="h-4 w-4 mr-2" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteForm(form.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {form.description || "No description"}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{form.status}</span>
                    <span>Draft</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}