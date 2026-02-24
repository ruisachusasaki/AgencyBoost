import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Music, 
  Video, 
  Archive, 
  FileSpreadsheet,
  Presentation,
  Code,
  Plus,
  X,
  MessageSquare
} from "lucide-react";
import { ObjectUploader } from "./ObjectUploader";
import { ImageAnnotationModal } from "./ImageAnnotationModal";
import { useToast } from "@/hooks/use-toast";

interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
  uploaderName?: string;
}

interface TaskAttachmentsProps {
  taskId: string;
}

export default function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; fileId: string; fileName: string } | null>(null);
  const [fileAnnotations, setFileAnnotations] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: attachments = [], isLoading } = useQuery<TaskAttachment[]>({
    queryKey: [`/api/tasks/${taskId}/attachments`],
  });

  // Check for annotations on image files
  const checkFileAnnotations = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/annotations`);
      if (response.ok) {
        const annotations = await response.json();
        setFileAnnotations(prev => ({
          ...prev,
          [fileId]: annotations.length > 0
        }));
      }
    } catch (error) {
      console.error('Failed to fetch annotations:', error);
    }
  };

  // Load annotations for image and PDF files
  useState(() => {
    attachments.forEach(file => {
      if (file.fileType.startsWith('image/') || file.fileType.includes('pdf')) {
        checkFileAnnotations(file.id);
      }
    });
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete attachment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/attachments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/activities`] });
      toast({
        title: "Success",
        variant: "default",
        description: "Attachment deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon;
    if (fileType.startsWith('audio/')) return Music;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('word') || fileType.includes('document')) return FileText;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return FileSpreadsheet;
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return Presentation;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) return Archive;
    if (fileType.includes('javascript') || fileType.includes('json') || fileType.includes('css') || fileType.includes('html')) return Code;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (files: Array<{url: string, name: string, size: number, type: string}>) => {
    try {
      // Upload each file to the backend
      for (const file of files) {        
        // Create attachment record in database
        const response = await fetch(`/api/tasks/${taskId}/attachments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileUrl: file.url, // Keep the original upload URL for server-side normalization
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save attachment');
        }
      }
      
      // Refresh attachments list
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/attachments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/activities`] });
      
      // Show success message
      toast({
        title: "Files uploaded successfully",
        variant: "default",
        description: `${files.length} file(s) uploaded to the task.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading the files.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-slate-500">Loading attachments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments ({attachments.length})
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploader(true)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            data-testid="button-add-attachment"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Files
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 && !showUploader ? (
          <div className="text-center py-8 text-slate-500">
            <Paperclip className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p>No attachments yet</p>
            <Button
              variant="ghost"
              onClick={() => setShowUploader(true)}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Upload your first file
            </Button>
          </div>
        ) : (
          <>
            {showUploader && (
              <div className="mb-6 p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-700">Upload Files</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUploader(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ObjectUploader
                  maxNumberOfFiles={10}
                  maxFileSize={50 * 1024 * 1024} // 50MB
                  onGetUploadParameters={async () => {
                    const response = await fetch(`/api/objects/upload`, { method: 'POST' });
                    const data = await response.json();
                    return { method: 'PUT' as const, url: data.uploadURL };
                  }}
                  onComplete={(result) => {
                    if (result.successful && result.successful.length > 0) {
                      const files = result.successful.map(file => ({
                        url: file.uploadURL || '',
                        name: file.name || 'Untitled',
                        size: file.size || 0,
                        type: file.type || 'application/octet-stream'
                      })).filter(file => file.url !== '');
                      if (files.length > 0) {
                        handleFileUpload(files);
                      }
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Choose Files</span>
                  </div>
                </ObjectUploader>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {attachments.map((attachment) => {
                const isImage = attachment.fileType.startsWith('image/');
                const FileIconComponent = getFileIcon(attachment.fileType);
                
                return (
                  <div
                    key={attachment.id}
                    className="relative group border border-slate-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 bg-white"
                    data-testid={`attachment-${attachment.id}`}
                  >
                    {/* File Preview/Icon */}
                    <div className="aspect-square mb-3 flex items-center justify-center bg-slate-50 rounded-md overflow-hidden">
                      {isImage ? (
                        <img
                          src={attachment.fileUrl}
                          alt={attachment.fileName}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage({
                            url: attachment.fileUrl,
                            fileId: attachment.id,
                            fileName: attachment.fileName
                          })}
                          data-testid={`image-preview-${attachment.id}`}
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : attachment.fileType.includes('pdf') ? (
                        <div 
                          className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => setSelectedImage({
                            url: attachment.fileUrl,
                            fileId: attachment.id,
                            fileName: attachment.fileName
                          })}
                        >
                          <FileIconComponent className="h-12 w-12 text-red-500" />
                        </div>
                      ) : (
                        <FileIconComponent className="h-12 w-12 text-slate-400" />
                      )}
                      {isImage && (
                        <FileIconComponent className="h-12 w-12 text-slate-400 hidden" />
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-slate-900 truncate" title={attachment.fileName}>
                        {attachment.fileName}
                      </h4>
                      <p className="text-xs text-slate-500">{formatFileSize(attachment.fileSize)}</p>
                      {attachment.uploaderName && (
                        <p className="text-xs text-slate-400">by {attachment.uploaderName}</p>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {(isImage || attachment.fileType.includes('pdf')) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className={`h-6 w-6 p-0 ${
                              fileAnnotations[attachment.id] 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-white/90 text-slate-600 hover:bg-white'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log("Opening annotation modal for:", attachment.fileName, attachment.fileType);
                              setSelectedImage({
                                url: attachment.fileUrl,
                                fileId: attachment.id,
                                fileName: attachment.fileName
                              });
                            }}
                            title={fileAnnotations[attachment.id] ? "View/edit annotations" : "Add annotation"}
                            data-testid={`button-annotate-${attachment.id}`}
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 w-6 p-0 bg-white/90 text-slate-600 hover:bg-white"
                          onClick={() => window.open(attachment.fileUrl, '_blank')}
                          title="Download"
                          data-testid={`button-download-${attachment.id}`}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 w-6 p-0 bg-red-100/90 text-red-600 hover:bg-red-200"
                          onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                          title="Delete"
                          data-testid={`button-delete-${attachment.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>

      {/* Image Annotation Modal */}
      {selectedImage && (
        <ImageAnnotationModal
          isOpen={!!selectedImage}
          onClose={() => {
            setSelectedImage(null);
            // Refresh annotation status after closing modal
            if (selectedImage.fileId) {
              checkFileAnnotations(selectedImage.fileId);
            }
          }}
          imageUrl={selectedImage.url}
          fileId={selectedImage.fileId}
          fileName={selectedImage.fileName}
          fileType={attachments.find(a => a.id === selectedImage.fileId)?.fileType}
        />
      )}
    </Card>
  );
}
