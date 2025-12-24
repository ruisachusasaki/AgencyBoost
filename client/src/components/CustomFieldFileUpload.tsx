import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, File, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { CustomFieldFileUpload } from "@shared/schema";

interface CustomFieldFileUploadProps {
  customFieldId: string;
  clientId: string;
  value?: CustomFieldFileUpload[];
  onChange: (files: CustomFieldFileUpload[]) => void;
  label?: string;
  required?: boolean;
}

const ACCEPTED_FILE_TYPES = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.rtf', '.pages', '.numbers',
  '.jpeg', '.jpg', '.png', '.gif', '.tiff',
  '.ppt', '.pptx', '.key'
];

const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB in bytes

export default function CustomFieldFileUpload({
  customFieldId,
  clientId,
  value = [],
  onChange,
  label = "File Upload",
  required = false,
}: CustomFieldFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<CustomFieldFileUpload[]>(value);
  const { toast } = useToast();

  // Fetch existing files for this custom field and client
  const { data: existingFiles, refetch } = useQuery({
    queryKey: [`/api/custom-field-files`, customFieldId, clientId],
    queryFn: async () => {
      const response = await fetch(`/api/custom-field-files?clientId=${clientId}&customFieldId=${customFieldId}`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch files');
      }
      return response.json();
    },
  });

  // Update local state when existing files are loaded
  useEffect(() => {
    if (existingFiles) {
      setFiles(existingFiles);
    }
  }, [existingFiles]);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 250MB limit. Current size: ${Math.round(file.size / 1024 / 1024)}MB`;
    }

    // Get file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    // Check if file type is accepted
    if (!ACCEPTED_FILE_TYPES.includes(extension)) {
      return `File type not supported. Accepted types: ${ACCEPTED_FILE_TYPES.join(', ')}`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Upload Error",
        variant: "success",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get upload URL from backend
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const uploadResponse = await apiRequest('POST', '/api/custom-field-files/upload-url', {
        customFieldId,
        clientId,
        fileName: file.name,
        fileSize: file.size,
        fileType: extension,
      });
      
      const responseData = await uploadResponse.json();
      const { uploadUrl, filePath } = responseData;

      // Upload file to object storage
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // Register file upload with backend
      const fileUploadResponse = await apiRequest('POST', '/api/custom-field-files', {
        customFieldId,
        clientId,
        fileName: filePath.split('/').pop(),
        originalFileName: file.name,
        fileType: extension,
        fileSize: file.size,
        filePath,
      });

      const fileUpload = await fileUploadResponse.json();
      // Update both local state and parent component
      const updatedFiles = [...files, fileUpload];
      setFiles(updatedFiles);
      onChange(updatedFiles);
      refetch(); // Refresh the query

      toast({
        title: "Success",
        variant: "success",
        description: "File uploaded successfully",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        variant: "success",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      await apiRequest('DELETE', `/api/custom-field-files/${fileId}`);

      const updatedFiles = files.filter(file => file.id !== fileId);
      setFiles(updatedFiles);
      onChange(updatedFiles);
      refetch(); // Refresh the query

      toast({
        title: "Success",
        variant: "success",
        description: "File removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove file",
        variant: "destructive",
      });
    }
  };

  const downloadFile = (file: CustomFieldFileUpload) => {
    window.open(`/api/custom-field-files/${file.id}/download`, '_blank');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    // Reset input value to allow re-uploading the same file
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Drag and drop your file here, or{' '}
            <Label htmlFor={`file-upload-${customFieldId}`} className="text-primary cursor-pointer hover:underline">
              browse to upload
            </Label>
          </p>
          <p className="text-xs text-gray-500">
            Supported: PDF, DOC, DOCX, XLS, XLSX, TXT, RTF, Pages, Numbers, JPG, PNG, GIF, TIFF, PPT, PPTX, KEY
          </p>
          <p className="text-xs text-gray-500">
            Maximum file size: 250MB
          </p>
        </div>
        <Input
          id={`file-upload-${customFieldId}`}
          type="file"
          className="hidden"
          accept={ACCEPTED_FILE_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={isUploading}
        />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <Alert>
          <AlertDescription>
            Uploading file...
          </AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploaded Files</Label>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{file.originalFileName}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.fileSize)} • {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadFile(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}