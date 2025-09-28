import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  MessageSquare,
  Eye
} from "lucide-react";
import { ImageAnnotationModal } from "./ImageAnnotationModal";

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

interface ClientPortalTaskAttachmentsProps {
  taskId: string;
  compact?: boolean;
}

export default function ClientPortalTaskAttachments({ taskId, compact = false }: ClientPortalTaskAttachmentsProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; fileId: string; fileName: string } | null>(null);
  const [fileAnnotations, setFileAnnotations] = useState<Record<string, boolean>>({});

  const { data: attachments = [], isLoading } = useQuery<TaskAttachment[]>({
    queryKey: [`/api/client-portal/tasks/${taskId}/attachments`],
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
  useEffect(() => {
    attachments.forEach(file => {
      if (file.fileType.startsWith('image/') || file.fileType.includes('pdf')) {
        checkFileAnnotations(file.id);
      }
    });
  }, [attachments]);

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

  const handleFileClick = (file: TaskAttachment) => {
    if (file.fileType.startsWith('image/')) {
      setSelectedImage({
        url: file.fileUrl,
        fileId: file.id,
        fileName: file.fileName
      });
    } else {
      // For non-images, open in new tab
      window.open(file.fileUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Paperclip className="h-4 w-4" />
        <span>Loading attachments...</span>
      </div>
    );
  }

  if (attachments.length === 0) {
    return null;
  }

  if (compact) {
    // Compact view for TaskCard
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Paperclip className="h-4 w-4" />
        <span>{attachments.length} attachment{attachments.length !== 1 ? 's' : ''}</span>
        {selectedImage && (
          <ImageAnnotationModal
            isOpen={!!selectedImage}
            onClose={() => setSelectedImage(null)}
            imageUrl={selectedImage.url}
            fileId={selectedImage.fileId}
            fileName={selectedImage.fileName}
            readOnly={true}
          />
        )}
      </div>
    );
  }

  // Full view for expanded task details
  return (
    <div className="space-y-2" data-testid={`attachments-${taskId}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Paperclip className="h-4 w-4" />
        Attachments ({attachments.length})
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {attachments.map((file) => {
          const IconComponent = getFileIcon(file.fileType);
          const hasAnnotations = fileAnnotations[file.id];
          
          return (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border hover:bg-muted/80 transition-colors"
              data-testid={`attachment-${file.id}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" title={file.fileName}>
                      {file.fileName}
                    </p>
                    {hasAnnotations && (
                      <Badge variant="secondary" className="text-xs">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Annotated
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.fileSize)}</span>
                    {file.uploaderName && (
                      <>
                        <span>•</span>
                        <span>Uploaded by {file.uploaderName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileClick(file)}
                  className="h-8 w-8 p-0"
                  data-testid={`button-view-${file.id}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.fileUrl, '_blank')}
                  className="h-8 w-8 p-0"
                  data-testid={`button-download-${file.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <ImageAnnotationModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          fileId={selectedImage.fileId}
          fileName={selectedImage.fileName}
          readOnly={true}
        />
      )}
    </div>
  );
}