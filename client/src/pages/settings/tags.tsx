import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tag, Plus, Edit, Trash2, Calendar } from "lucide-react";

interface TagItem {
  id: string;
  name: string;
  color: string;
  usageCount: number;
  createdAt: string;
}

export default function Tags() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock tags data
  const [tags] = useState<TagItem[]>([
    { id: "1", name: "high-priority", color: "red", usageCount: 12, createdAt: "2024-01-15" },
    { id: "2", name: "tech", color: "blue", usageCount: 8, createdAt: "2024-02-01" },
    { id: "3", name: "new-client", color: "green", usageCount: 15, createdAt: "2024-03-10" },
    { id: "4", name: "follow-up", color: "yellow", usageCount: 6, createdAt: "2024-04-05" },
    { id: "5", name: "lead-nurture", color: "purple", usageCount: 3, createdAt: "2024-05-12" }
  ]);

  const [newTag, setNewTag] = useState({
    name: "",
    color: "blue"
  });

  const colors = [
    { name: "Red", value: "red", bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
    { name: "Blue", value: "blue", bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
    { name: "Green", value: "green", bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
    { name: "Yellow", value: "yellow", bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
    { name: "Purple", value: "purple", bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
    { name: "Gray", value: "gray", bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" }
  ];

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implement API call to add tag
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Success",
        description: "Tag created successfully.",
      });
      
      setIsAddDialogOpen(false);
      setNewTag({ name: "", color: "blue" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag? This will remove it from all associated records.")) return;
    
    try {
      // TODO: Implement API call to delete tag
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Success",
        description: "Tag deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tag. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTagColorClasses = (color: string) => {
    const colorMap = colors.find(c => c.value === color);
    return colorMap ? `${colorMap.bg} ${colorMap.text} ${colorMap.border}` : "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Tag className="h-8 w-8 text-primary" />
              Tag Management
            </h1>
            <p className="text-gray-600 mt-2">Organize and manage system tags</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tag</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTag} className="space-y-4">
                <div>
                  <Label htmlFor="tagName">Tag Name *</Label>
                  <Input
                    id="tagName"
                    value={newTag.name}
                    onChange={(e) => setNewTag({...newTag, name: e.target.value})}
                    placeholder="e.g., high-priority"
                    required
                  />
                </div>
                
                <div>
                  <Label>Tag Color</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewTag({...newTag, color: color.value})}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          newTag.color === color.value 
                            ? `${color.bg} ${color.border} ring-2 ring-primary` 
                            : `${color.bg} ${color.border} hover:ring-1 hover:ring-gray-300`
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${color.bg.replace('bg-', 'bg-').replace('100', '500')}`}></div>
                        <span className={`text-xs font-medium ${color.text}`}>{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Tag"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tags Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <Card key={tag.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full border ${getTagColorClasses(tag.color)}`}>
                      <span className="text-sm font-medium">{tag.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTag(tag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Usage Count:</span>
                    <Badge variant="secondary">{tag.usageCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Created:</span>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {tag.createdAt}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tag Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{tags.length}</div>
                <div className="text-sm text-gray-600">Total Tags</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {tags.reduce((sum, tag) => sum + tag.usageCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Usage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {Math.round(tags.reduce((sum, tag) => sum + tag.usageCount, 0) / tags.length)}
                </div>
                <div className="text-sm text-gray-600">Avg Usage per Tag</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}