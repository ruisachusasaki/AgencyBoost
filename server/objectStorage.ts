import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// The object storage client is used to interact with the object storage service.
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}



// File validation constants
export const ACCEPTED_FILE_TYPES = [
  // Documents & Text
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.rtf', '.pages', '.numbers',
  // Images
  '.jpeg', '.jpg', '.png', '.gif', '.tiff',
  // Presentations & Data
  '.ppt', '.pptx', '.key'
];

export const FORBIDDEN_FILE_TYPES = [
  '.exe', '.bat', '.sh', '.msi', '.js', '.php', '.html', '.css', '.zip'
];

export const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB in bytes

export function validateFileType(fileName: string): boolean {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return ACCEPTED_FILE_TYPES.includes(extension);
}

export function isForbiddenFileType(fileName: string): boolean {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return FORBIDDEN_FILE_TYPES.includes(extension);
}

export function sanitizeFileName(fileName: string): string {
  // Remove directory traversal patterns and special characters
  const sanitized = fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove forbidden characters
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^\w\.-]/g, ''); // Keep only word characters, dots, and hyphens
  
  // Ensure filename isn't empty after sanitization
  return sanitized || `file_${Date.now()}`;
}

export function getFileExtension(fileName: string): string {
  return fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  constructor() {}

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Gets the upload URL for a custom field file upload.
  async getCustomFieldFileUploadURL(fileExtension: string): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const fileId = randomUUID();
    const fileName = `custom_field_${fileId}${fileExtension}`;
    const fullPath = `${privateObjectDir}/custom_fields/${fileName}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Sign URL for PUT method with TTL
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900, // 15 minutes
    });
  }

  // Gets the file from the object storage path
  async getFileFromPath(filePath: string): Promise<File> {
    const { bucketName, objectName } = parseObjectPath(filePath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return file;
  }

  // Downloads a file to the response.
  async downloadFile(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `private, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Extract file path from presigned URL
  extractFilePathFromUrl(uploadUrl: string): string {
    try {
      const url = new URL(uploadUrl);
      const pathParts = url.pathname.split('/');
      const bucketName = pathParts[1];
      const objectPath = pathParts.slice(2).join('/');
      return `/${bucketName}/${objectPath}`;
    } catch (error) {
      throw new Error('Invalid upload URL');
    }
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}