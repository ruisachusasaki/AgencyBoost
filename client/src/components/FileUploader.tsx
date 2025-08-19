import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management with comprehensive validation.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for file selection, preview, and upload progress
 * - Server-side and client-side file type validation
 * - File size validation
 * - Security validation to prevent dangerous file uploads
 * 
 * Supported file types:
 * Documents: .pdf, .doc, .docx, .xls, .xlsx, .txt, .rtf, .pages, .numbers
 * Images: .jpeg, .jpg, .png, .gif, .tiff
 * Presentations: .ppt, .pptx, .key
 * Audio: .mp3, .wav, .m4a, .aac (for audio clips)
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed (default: 5)
 * @param props.maxFileSize - Maximum file size in bytes (default: 250MB)
 * @param props.allowedFileTypes - Array of allowed file extensions
 * @param props.onGetUploadParameters - Function to get presigned URL from server
 * @param props.onComplete - Callback when upload is complete
 * @param props.buttonClassName - Optional CSS class for the button
 * @param props.children - Content to render inside the button
 */
export function FileUploader({
  maxNumberOfFiles = 5,
  maxFileSize = 250 * 1024 * 1024, // 250MB default
  allowedFileTypes = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.rtf', '.pages', '.numbers',
    '.jpeg', '.jpg', '.png', '.gif', '.tiff',
    '.ppt', '.pptx', '.key',
    '.mp3', '.wav', '.m4a', '.aac' // Audio files
  ],
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: FileUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        setShowModal(false);
        onComplete?.(result);
      })
      .on("error", (error) => {
        console.error("Upload error:", error);
      })
  );

  return (
    <div>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        type="button"
        data-testid="button-file-upload"
      >
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        closeModalOnClickOutside
        animateOpenClose={true}
        browserBackButtonClose
        showLinkToFileUploadResult={true}
      />
    </div>
  );
}