import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageSquare, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ImageAnnotation, InsertImageAnnotation } from "@shared/schema";

interface ImageAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileId: string;
  fileName: string;
  fileType?: string;
}

interface AnnotationPin {
  id?: string;
  x: number;
  y: number;
  content: string;
  isNew?: boolean;
}

export function ImageAnnotationModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  fileId, 
  fileName,
  fileType = 'image'
}: ImageAnnotationModalProps) {
  const [annotations, setAnnotations] = useState<AnnotationPin[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationPin | null>(null);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [newAnnotationContent, setNewAnnotationContent] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing annotations
  const { data: existingAnnotations } = useQuery({
    queryKey: [`/api/files/${fileId}/annotations`],
    enabled: isOpen && !!fileId,
  });

  // Load existing annotations when data changes
  useEffect(() => {
    if (existingAnnotations && Array.isArray(existingAnnotations)) {
      const formattedAnnotations: AnnotationPin[] = existingAnnotations.map((ann: ImageAnnotation) => ({
        id: ann.id,
        x: parseFloat(ann.x),
        y: parseFloat(ann.y),
        content: ann.content,
      }));
      setAnnotations(formattedAnnotations);
    }
  }, [existingAnnotations]);

  // Create annotation mutation
  const createAnnotationMutation = useMutation({
    mutationFn: async (data: { x: number; y: number; content: string }) => {
      return apiRequest(`/api/files/${fileId}/annotations`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${fileId}/annotations`] });
      toast({
        title: "Success",
        description: "Annotation created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create annotation",
        variant: "destructive",
      });
    },
  });

  // Update annotation mutation
  const updateAnnotationMutation = useMutation({
    mutationFn: async (data: { id: string; content: string }) => {
      return apiRequest(`/api/annotations/${data.id}`, "PUT", { content: data.content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${fileId}/annotations`] });
      toast({
        title: "Success",
        description: "Annotation updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update annotation",
        variant: "destructive",
      });
    },
  });

  // Delete annotation mutation
  const deleteAnnotationMutation = useMutation({
    mutationFn: async (annotationId: string) => {
      return apiRequest(`/api/annotations/${annotationId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${fileId}/annotations`] });
      toast({
        title: "Success",
        description: "Annotation deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete annotation",
        variant: "destructive",
      });
    },
  });

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isAddingAnnotation || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newAnnotation: AnnotationPin = {
      x,
      y,
      content: "",
      isNew: true,
    };

    setAnnotations([...annotations, newAnnotation]);
    setSelectedAnnotation(newAnnotation);
    setIsAddingAnnotation(false);
  };

  const handleSaveAnnotation = () => {
    if (!selectedAnnotation || !newAnnotationContent.trim()) return;

    if (selectedAnnotation.isNew) {
      // Create new annotation
      createAnnotationMutation.mutate({
        x: selectedAnnotation.x,
        y: selectedAnnotation.y,
        content: newAnnotationContent,
      });

      // Remove the temporary annotation
      setAnnotations(annotations.filter(ann => ann !== selectedAnnotation));
    } else if (selectedAnnotation.id) {
      // Update existing annotation
      updateAnnotationMutation.mutate({
        id: selectedAnnotation.id,
        content: newAnnotationContent,
      });
    }

    setSelectedAnnotation(null);
    setNewAnnotationContent("");
  };

  const handleDeleteAnnotation = (annotation: AnnotationPin) => {
    if (annotation.id) {
      deleteAnnotationMutation.mutate(annotation.id);
    } else {
      // Remove temporary annotation
      setAnnotations(annotations.filter(ann => ann !== annotation));
      if (selectedAnnotation === annotation) {
        setSelectedAnnotation(null);
        setNewAnnotationContent("");
      }
    }
  };

  const handleSelectAnnotation = (annotation: AnnotationPin) => {
    setSelectedAnnotation(annotation);
    setNewAnnotationContent(annotation.content);
  };

  const handleClose = () => {
    setAnnotations([]);
    setSelectedAnnotation(null);
    setNewAnnotationContent("");
    setIsAddingAnnotation(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col" data-testid="image-annotation-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Annotate Image: {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Image Container */}
          <div className="flex-1 relative bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <Button
                onClick={() => setIsAddingAnnotation(true)}
                disabled={isAddingAnnotation}
                size="sm"
                data-testid="button-add-annotation"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Annotation
              </Button>
              {isAddingAnnotation && (
                <Badge variant="secondary">Click on the image to add annotation</Badge>
              )}
            </div>

            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="relative">
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain cursor-crosshair"
                  onClick={handleImageClick}
                  data-testid="annotation-image"
                />

                {/* Annotation Pins */}
                {annotations.map((annotation, index) => (
                  <div
                    key={annotation.id || `temp-${index}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{
                      left: `${annotation.x}%`,
                      top: `${annotation.y}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAnnotation(annotation);
                    }}
                    data-testid={`annotation-pin-${annotation.id || index}`}
                  >
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        selectedAnnotation === annotation 
                          ? 'bg-blue-600 ring-2 ring-blue-300' 
                          : annotation.isNew 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Annotation Panel */}
          <div className="w-80 flex flex-col gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold">
              Annotations ({annotations.length})
            </h3>

            {/* Annotation List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {annotations.map((annotation, index) => (
                <div
                  key={annotation.id || `temp-${index}`}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAnnotation === annotation
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleSelectAnnotation(annotation)}
                  data-testid={`annotation-item-${annotation.id || index}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className={`w-4 h-4 rounded-full text-white text-xs flex items-center justify-center ${
                            annotation.isNew ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({Math.round(annotation.x)}%, {Math.round(annotation.y)}%)
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {annotation.content || 'Click to add content...'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAnnotation(annotation);
                      }}
                      data-testid={`button-delete-annotation-${annotation.id || index}`}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}

              {annotations.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No annotations yet</p>
                  <p className="text-sm">Click "Add Annotation" to get started</p>
                </div>
              )}
            </div>

            {/* Edit Panel */}
            {selectedAnnotation && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">
                  {selectedAnnotation.isNew ? 'Add' : 'Edit'} Annotation
                </h4>
                <Textarea
                  value={newAnnotationContent}
                  onChange={(e) => setNewAnnotationContent(e.target.value)}
                  placeholder="Enter annotation comment..."
                  className="mb-3"
                  rows={3}
                  data-testid="textarea-annotation-content"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveAnnotation}
                    disabled={!newAnnotationContent.trim() || createAnnotationMutation.isPending || updateAnnotationMutation.isPending}
                    size="sm"
                    data-testid="button-save-annotation"
                  >
                    {selectedAnnotation.isNew ? 'Add' : 'Update'}
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedAnnotation.isNew) {
                        handleDeleteAnnotation(selectedAnnotation);
                      } else {
                        setSelectedAnnotation(null);
                        setNewAnnotationContent("");
                      }
                    }}
                    variant="outline"
                    size="sm"
                    data-testid="button-cancel-annotation"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}