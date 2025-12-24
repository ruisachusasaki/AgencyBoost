import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ThumbnailUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
}

export function ThumbnailUpload({ value, onChange, onRemove }: ThumbnailUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Recommended size: 1200x675 (16:9 aspect ratio) for course thumbnails
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get upload URL from backend
      const uploadResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await uploadResponse.json();

      // Upload file directly to object storage
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          // Set object ACL policy for public access
          try {
            const aclResponse = await fetch('/api/course-thumbnails', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                thumbnailImageURL: uploadURL.split('?')[0], // Remove query params
              }),
            });

            if (aclResponse.ok) {
              const { objectPath } = await aclResponse.json();
              const publicUrl = `/objects${objectPath}`;
              onChange(publicUrl);
              
              toast({
                title: "Upload successful",
                variant: "success",
                description: "Course thumbnail uploaded successfully",
              });
            } else {
              throw new Error('Failed to set image permissions');
            }
          } catch (error) {
            console.error('Error setting ACL:', error);
            toast({
              title: "Upload warning",
              description: "Image uploaded but permissions may not be set correctly",
              variant: "destructive",
            });
          }
        } else {
          throw new Error('Upload failed');
        }
        setIsUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener('error', () => {
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        setIsUploading(false);
        setUploadProgress(0);
      });

      xhr.open('PUT', uploadURL);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label>Course Thumbnail</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-3">
              <div className="text-sm">
                <p className="font-medium mb-2">Thumbnail Guidelines:</p>
                <ul className="text-xs space-y-1">
                  <li>• Recommended size: 1200×675 pixels (16:9 aspect ratio)</li>
                  <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                  <li>• Maximum file size: 5MB</li>
                  <li>• Use high-quality images for best results</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="p-6">
          {value ? (
            // Show uploaded image
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={value} 
                  alt="Course thumbnail" 
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    // Fallback for broken images
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%23f3f4f6'/%3E%3Ctext x='200' y='112.5' text-anchor='middle' fill='%23666' font-family='sans-serif' font-size='14'%3EImage not found%3C/text%3E%3C/svg%3E";
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={onRemove}
                  data-testid="remove-thumbnail"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                <p>Current thumbnail uploaded successfully</p>
                <p className="text-xs mt-1">Click the upload button below to replace it</p>
              </div>
            </div>
          ) : (
            // Show upload prompt
            <div className="text-center">
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Upload a course thumbnail image
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Recommended: 1200×675px (16:9 ratio), JPG/PNG, max 5MB
              </p>
            </div>
          )}
          
          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => document.getElementById('thumbnail-upload')?.click()}
              data-testid="upload-thumbnail-button"
            >
              <Upload className="h-4 w-4 mr-2" />
              {value ? 'Replace Image' : 'Upload Image'}
            </Button>
            <input
              id="thumbnail-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="thumbnail-file-input"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
