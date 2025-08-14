import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FileText, 
  Plus,
  FolderPlus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Form, FormFolder } from "@shared/schema";
import { format } from "date-fns";

export default function FormsBuilder() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "updatedAt">("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [isCreateFormDialogOpen, setIsCreateFormDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch form folders
  const { data: formFolders = [], isLoading: loadingFolders } = useQuery<FormFolder[]>({
    queryKey: ["/api/form-folders"],
  });

  // Fetch forms
  const { data: forms = [], isLoading: loadingForms } = useQuery<Form[]>({
    queryKey: ["/api/forms"],
  });

  // Get user permissions for admin-only delete
  const { data: userPermissions } = useQuery({
    queryKey: ["/api/user-permissions"],
  });

  const canDelete = userPermissions?.settings?.canManage || false;

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest("POST", "/api/form-folders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/form-folders"] });
      setIsCreateFolderDialogOpen(false);
      toast({
        title: "Success",
        description: "Form folder created successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to create folder:", error);
      toast({
        title: "Error", 
        description: "Failed to create form folder",
        variant: "destructive",
      });
    },
  });

  // Create form mutation
  const createFormMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; folderId?: string }) => {
      return await apiRequest("POST", "/api/forms", {
        ...data,
        fields: [], // Start with empty fields
        settings: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      setIsCreateFormDialogOpen(false);
      toast({
        title: "Success",
        description: "Form created successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to create form:", error);
      toast({
        title: "Error",
        description: "Failed to create form",
        variant: "destructive",
      });
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/form-folders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/form-folders"] });
      toast({
        title: "Success",
        description: "Form folder deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to delete folder:", error);
      toast({
        title: "Error",
        description: "Failed to delete form folder",
        variant: "destructive",
      });
    },
  });

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success",
        description: "Form deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to delete form:", error);
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive",
      });
    },
  });

  // Filter and sort logic
  const filteredItems = [...formFolders, ...forms]
    .filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return item.name.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortField === "name") {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else {
        aValue = new Date(a.updatedAt || a.createdAt);
        bValue = new Date(b.updatedAt || b.createdAt);
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: "name" | "updatedAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "name" | "updatedAt") => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getUpdatedByName = (item: Form | FormFolder) => {
    // For now, return "System" as we'll need to fetch user data
    return "System";
  };

  const isFolder = (item: Form | FormFolder): item is FormFolder => {
    return !('fields' in item);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Forms Builder</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage your forms
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-create-folder">
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Form Folder</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  createFolderMutation.mutate({
                    name: formData.get("name") as string,
                    description: formData.get("description") as string || undefined,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Folder Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Enter folder name"
                    data-testid="input-folder-name"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description (Optional)
                  </label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Enter folder description"
                    data-testid="input-folder-description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateFolderDialogOpen(false)}
                    data-testid="button-cancel-folder"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createFolderMutation.isPending}
                    data-testid="button-save-folder"
                  >
                    {createFolderMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateFormDialogOpen} onOpenChange={setIsCreateFormDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-form">
                <Plus className="h-4 w-4 mr-2" />
                Add Form
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Form</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  createFormMutation.mutate({
                    name: formData.get("name") as string,
                    description: formData.get("description") as string || undefined,
                    folderId: formData.get("folderId") as string || undefined,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="form-name" className="block text-sm font-medium mb-1">
                    Form Name
                  </label>
                  <Input
                    id="form-name"
                    name="name"
                    required
                    placeholder="Enter form name"
                    data-testid="input-form-name"
                  />
                </div>
                <div>
                  <label htmlFor="form-description" className="block text-sm font-medium mb-1">
                    Description (Optional)
                  </label>
                  <Input
                    id="form-description"
                    name="description"
                    placeholder="Enter form description"
                    data-testid="input-form-description"
                  />
                </div>
                <div>
                  <label htmlFor="form-folder" className="block text-sm font-medium mb-1">
                    Folder (Optional)
                  </label>
                  <select
                    id="form-folder"
                    name="folderId"
                    className="w-full p-2 border border-input rounded-md bg-background"
                    data-testid="select-form-folder"
                  >
                    <option value="">No Folder</option>
                    {formFolders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateFormDialogOpen(false)}
                    data-testid="button-cancel-form"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createFormMutation.isPending}
                    data-testid="button-save-form"
                  >
                    {createFormMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search forms and folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-forms"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Forms & Folders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("name")}
                  data-testid="header-name"
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("updatedAt")}
                  data-testid="header-updated"
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Update</span>
                    {getSortIcon("updatedAt")}
                  </div>
                </TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingFolders || loadingForms ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm ? "No forms or folders match your search." : "No forms or folders created yet."}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => (
                  <TableRow key={item.id} data-testid={`row-${isFolder(item) ? 'folder' : 'form'}-${item.id}`}>
                    <TableCell>
                      <Badge variant={isFolder(item) ? "secondary" : "default"}>
                        {isFolder(item) ? "Folder" : "Form"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-name-${item.id}`}>
                      {item.name}
                    </TableCell>
                    <TableCell data-testid={`text-updated-${item.id}`}>
                      {format(new Date(item.updatedAt || item.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell data-testid={`text-updated-by-${item.id}`}>
                      {getUpdatedByName(item)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-menu-${item.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem data-testid={`button-edit-${item.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (isFolder(item)) {
                                  deleteFolderMutation.mutate(item.id);
                                } else {
                                  deleteFormMutation.mutate(item.id);
                                }
                              }}
                              data-testid={`button-delete-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      data-testid={`button-page-${page}`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}