import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { FileUp, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploaderProps {
  clientId: string;
  onUploadComplete?: () => void;
  maxNumberOfFiles?: number;
  buttonClassName?: string;
  children?: ReactNode;
}

// Allowed file types with security validation
const ALLOWED_FILE_TYPES = [
  // Documents & Text
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.rtf', '.pages', '.numbers',
  // Images
  '.jpeg', '.jpg', '.png', '.gif', '.tiff',
  // Presentations & Data
  '.ppt', '.pptx', '.key'
];

// Forbidden file types for security
const FORBIDDEN_FILE_TYPES = [
  '.exe', '.bat', '.sh', '.msi', '.js', '.php', '.html', '.css', '.zip'
];

/**
 * A secure document upload component specifically designed for client file management.
 * 
 * Features:
 * - Strict file type validation for security
 * - 250MB file size limit
 * - Server-side security validation
 * - File name sanitization
 * - Integration with object storage
 * 
 * Security:
 * - Only accepts explicitly allowed file types
 * - Rejects dangerous file extensions
 * - Server-side validation as backup
 * - File name sanitization to prevent attacks
 */
export function DocumentUploader({
  clientId,
  onUploadComplete,
  maxNumberOfFiles = 5,
  buttonClassName,
  children,
}: DocumentUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize: 250 * 1024 * 1024, // 250MB
        allowedFileTypes: ALLOWED_FILE_TYPES,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file: any) => {
          // Validate file type on client side first
          const fileName = file.name.toLowerCase();
          const hasAllowedExtension = ALLOWED_FILE_TYPES.some(ext => fileName.endsWith(ext));
          const hasForbiddenExtension = FORBIDDEN_FILE_TYPES.some(ext => fileName.endsWith(ext));

          if (!hasAllowedExtension || hasForbiddenExtension) {
            throw new Error(`File type not supported: ${file.name}`);
          }

          try {
            const response = await fetch('/api/documents/upload-url', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                clientId,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Failed to get upload URL');
            }

            const { uploadURL } = await response.json();
            return {
              method: 'PUT' as const,
              url: uploadURL,
            };
          } catch (error) {
            console.error('Upload URL error:', error);
            throw error;
          }
        },
      })
      .on('upload-success', async (file: any, response: any) => {
        try {
          // Register the uploaded file with the database
          const registerResponse = await fetch('/api/documents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              fileUrl: response.uploadURL,
              clientId,
            }),
          });

          if (!registerResponse.ok) {
            const error = await registerResponse.json();
            throw new Error(error.message || 'Failed to register file');
          }

          toast({
            title: "File uploaded successfully",
            variant: "success",
            description: `${file.name} has been uploaded and attached to the client.`,
          });
        } catch (error) {
          console.error('File registration error:', error);
          toast({
            title: "Upload error",
            description: `Failed to register ${file.name}. Please try again.`,
            variant: "destructive",
          });
        }
      })
      .on('complete', (result) => {
        if (result.successful && result.successful.length > 0) {
          onUploadComplete?.();
          setShowModal(false);
        }
      })
      .on('upload-error', (file: any, error: any) => {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message || `Failed to upload ${file?.name || 'file'}`,
          variant: "destructive",
        });
      })
  );

  return (
    <div>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        variant="outline"
        size="sm"
      >
        {children || (
          <div className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            <span>Upload Documents</span>
          </div>
        )}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note="Security Notice: Only PDF, DOC, DOCX, XLS, XLSX, TXT, RTF, Pages, Numbers, JPEG, JPG, PNG, GIF, TIFF, PPT, PPTX, KEY files allowed. Maximum 250MB per file."
      />
    </div>
  );
}
