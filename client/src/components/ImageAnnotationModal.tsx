import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, MessageSquare, Plus, AtSign, Check } from "lucide-react";
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
  mentions?: string[];
  isNew?: boolean;
  isCompleted?: boolean;
}

export function ImageAnnotationModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  fileId, 
  fileName,
  fileType = 'image'
}: ImageAnnotationModalProps) {
  console.log("ImageAnnotationModal rendered", { isOpen, fileType, fileName, imageUrl });
  
  const [annotations, setAnnotations] = useState<AnnotationPin[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationPin | null>(null);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [newAnnotationContent, setNewAnnotationContent] = useState("");
  
  // @mention state management
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState<{top: number, left: number}>({ top: 0, left: 0 });
  
  const imageRef = useRef<HTMLImageElement | HTMLVideoElement | HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing annotations
  const { data: existingAnnotations } = useQuery({
    queryKey: [`/api/files/${fileId}/annotations`],
    enabled: isOpen && !!fileId,
  });

  // Fetch staff for @mentions
  const { data: staff = [] } = useQuery({
    queryKey: ['/api/staff'],
    enabled: isOpen,
  });

  // Load existing annotations when data changes
  useEffect(() => {
    if (existingAnnotations && Array.isArray(existingAnnotations)) {
      const formattedAnnotations: AnnotationPin[] = existingAnnotations.map((ann: ImageAnnotation) => ({
        id: ann.id,
        x: parseFloat(ann.x),
        y: parseFloat(ann.y),
        content: ann.content,
        mentions: ann.mentions || [],
        isCompleted: ann.isCompleted || false,
      }));
      setAnnotations(formattedAnnotations);
    }
  }, [existingAnnotations]);

  // @mention input handling
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewAnnotationContent(value);

    const textarea = e.target;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const filter = mentionMatch[1];
      setMentionFilter(filter);
      setShowMentionDropdown(true);
      setSelectedMentionIndex(0);

      // Calculate position for dropdown relative to textarea
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length - 1;
      const lineHeight = 24;
      const top = (currentLine * lineHeight) + 28; // Position below current line
      const left = 0; // Align with textarea left edge
      
      setMentionPosition({ top, left });
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Handle @mention selection
  const handleMentionSelect = (staffMember: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = newAnnotationContent.slice(0, cursorPosition);
    const textAfterCursor = newAnnotationContent.slice(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
      const mentionText = `@${staffMember.firstName} ${staffMember.lastName}`;
      const newText = beforeMention + mentionText + ' ' + textAfterCursor;
      
      setNewAnnotationContent(newText);
      setMentions(prev => [...prev, staffMember.id]);
      setShowMentionDropdown(false);

      // Set cursor position after mention
      setTimeout(() => {
        const newPosition = beforeMention.length + mentionText.length + 1;
        textarea.setSelectionRange(newPosition, newPosition);
        textarea.focus();
      }, 0);
    }
  };

  // Handle keyboard navigation in mention dropdown
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionDropdown) return;

    const filteredStaff = (staff as any[]).filter((s: any) => 
      s.firstName.toLowerCase().includes(mentionFilter.toLowerCase()) ||
      s.lastName.toLowerCase().includes(mentionFilter.toLowerCase())
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex(prev => Math.min(prev + 1, filteredStaff.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredStaff[selectedMentionIndex]) {
        handleMentionSelect(filteredStaff[selectedMentionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowMentionDropdown(false);
    }
  };

  // Filter staff for mentions
  const filteredStaff = (staff as any[]).filter((s: any) => 
    s.firstName.toLowerCase().includes(mentionFilter.toLowerCase()) ||
    s.lastName.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // Create annotation mutation
  const createAnnotationMutation = useMutation({
    mutationFn: async (data: { x: string; y: string; content: string; mentions: string[] }) => {
      return apiRequest("POST", `/api/files/${fileId}/annotations`, data);
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
    mutationFn: async (data: { id: string; content: string; mentions: string[] }) => {
      return apiRequest("PUT", `/api/annotations/${data.id}`, { content: data.content, mentions: data.mentions });
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
      return apiRequest("DELETE", `/api/annotations/${annotationId}`);
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

  // Toggle annotation completion mutation
  const toggleCompletionMutation = useMutation({
    mutationFn: async (annotationId: string) => {
      return apiRequest("PATCH", `/api/annotations/${annotationId}/toggle-complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${fileId}/annotations`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update annotation status",
        variant: "destructive",
      });
    },
  });

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement | HTMLDivElement>) => {
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
        x: selectedAnnotation.x.toString(),
        y: selectedAnnotation.y.toString(),
        content: newAnnotationContent,
        mentions: mentions,
      });

      // Remove the temporary annotation
      setAnnotations(annotations.filter(ann => ann !== selectedAnnotation));
    } else if (selectedAnnotation.id) {
      // Update existing annotation
      updateAnnotationMutation.mutate({
        id: selectedAnnotation.id,
        content: newAnnotationContent,
        mentions: mentions,
      });
    }

    setSelectedAnnotation(null);
    setNewAnnotationContent("");
    setMentions([]);
    setShowMentionDropdown(false);
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
    setMentions(annotation.mentions || []);
    setShowMentionDropdown(false);
  };

  const handleClose = () => {
    setAnnotations([]);
    setSelectedAnnotation(null);
    setNewAnnotationContent("");
    setIsAddingAnnotation(false);
    setMentions([]);
    setShowMentionDropdown(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col" data-testid="image-annotation-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Annotate {fileType?.includes('pdf') ? 'PDF' : fileType?.includes('video') ? 'Video' : 'Image'}: {fileName}
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
                <Badge variant="secondary">
                  Click on the {fileType?.includes('pdf') ? 'PDF' : fileType?.includes('video') ? 'video' : 'image'} to add annotation
                </Badge>
              )}
            </div>

            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="relative">
                {fileType?.includes('pdf') ? (
                  <div className="relative">
                    <iframe
                      ref={imageRef as any}
                      src={imageUrl}
                      className="w-full h-full border border-gray-300 rounded"
                      data-testid="annotation-pdf"
                      style={{ minHeight: '600px', pointerEvents: 'none' }}
                    />
                    {/* Invisible overlay to capture clicks for PDF annotation */}
                    <div 
                      className="absolute inset-0 cursor-crosshair"
                      onClick={handleImageClick}
                      style={{ zIndex: 5 }}
                    />
                    
                    {/* Annotation Pins for PDF */}
                    {annotations.map((annotation, index) => (
                      <div
                        key={annotation.id || `temp-${index}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        style={{
                          left: `${annotation.x}%`,
                          top: `${annotation.y}%`,
                          zIndex: 10
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAnnotation(annotation);
                        }}
                        data-testid={`annotation-pin-${annotation.id || index}`}
                      >
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white ${
                            selectedAnnotation === annotation 
                              ? 'bg-blue-600 ring-2 ring-blue-300' 
                              : annotation.isNew 
                                ? 'bg-yellow-500'
                                : annotation.isCompleted
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                          }`}
                        >
                          {annotation.isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : fileType?.includes('video') ? (
                  <div className="relative">
                    <video
                      ref={imageRef as any}
                      src={imageUrl}
                      controls
                      className="max-w-full max-h-full border border-gray-300 rounded"
                      data-testid="annotation-video"
                      style={{ maxHeight: '600px' }}
                    />
                    {/* Invisible overlay to capture clicks for video annotation - only when adding annotation */}
                    {isAddingAnnotation && (
                      <div 
                        className="absolute inset-0 cursor-crosshair"
                        onClick={handleImageClick}
                        style={{ zIndex: 5 }}
                      />
                    )}
                    
                    {/* Annotation Pins for Video */}
                    {annotations.map((annotation, index) => (
                      <div
                        key={annotation.id || `temp-${index}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        style={{
                          left: `${annotation.x}%`,
                          top: `${annotation.y}%`,
                          zIndex: 10
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAnnotation(annotation);
                        }}
                        data-testid={`annotation-pin-${annotation.id || index}`}
                      >
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white ${
                            selectedAnnotation === annotation 
                              ? 'bg-blue-600 ring-2 ring-blue-300' 
                              : annotation.isNew 
                                ? 'bg-yellow-500'
                                : annotation.isCompleted
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                          }`}
                        >
                          {annotation.isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      ref={imageRef}
                      src={imageUrl}
                      alt={fileName}
                      className="max-w-full max-h-full object-contain cursor-crosshair"
                      onClick={handleImageClick}
                      data-testid="annotation-image"
                    />
                    
                    {/* Annotation Pins for Image */}
                    {annotations.map((annotation, index) => (
                      <div
                        key={annotation.id || `temp-${index}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        style={{
                          left: `${annotation.x}%`,
                          top: `${annotation.y}%`,
                          zIndex: 10
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAnnotation(annotation);
                        }}
                        data-testid={`annotation-pin-${annotation.id || index}`}
                      >
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white ${
                            selectedAnnotation === annotation 
                              ? 'bg-blue-600 ring-2 ring-blue-300' 
                              : annotation.isNew 
                                ? 'bg-yellow-500'
                                : annotation.isCompleted
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                          }`}
                        >
                          {annotation.isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                            annotation.isNew 
                              ? 'bg-yellow-500' 
                              : annotation.isCompleted 
                                ? 'bg-green-500' 
                                : 'bg-red-500'
                          }`}
                        >
                          {annotation.isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({Math.round(annotation.x)}%, {Math.round(annotation.y)}%)
                        </span>
                      </div>
                      <p className={`text-sm ${annotation.isCompleted ? 'text-green-600 dark:text-green-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                        {annotation.content || 'Click to add content...'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!annotation.isNew && annotation.id && (
                        <Checkbox
                          checked={annotation.isCompleted || false}
                          onCheckedChange={(checked) => {
                            toggleCompletionMutation.mutate(annotation.id!);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`checkbox-complete-annotation-${annotation.id || index}`}
                          className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                        />
                      )}
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
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={newAnnotationContent}
                    onChange={handleTextareaInput}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder="Enter annotation comment... Use @ to mention team members"
                    className="mb-3"
                    rows={3}
                    data-testid="textarea-annotation-content"
                  />
                  
                  {/* @mention dropdown */}
                  {showMentionDropdown && filteredStaff.length > 0 && (
                    <div
                      className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto z-50"
                      style={{
                        top: mentionPosition.top,
                        left: mentionPosition.left,
                        minWidth: '250px'
                      }}
                    >
                      {filteredStaff.map((staffMember: any, index: number) => (
                        <div
                          key={staffMember.id}
                          className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                            index === selectedMentionIndex
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => handleMentionSelect(staffMember)}
                        >
                          <AtSign className="w-4 h-4" />
                          <span>{staffMember.firstName} {staffMember.lastName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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