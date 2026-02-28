// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

// server/objectAcl.ts
var ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  return false;
}

// server/objectStorage.ts
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ACCEPTED_FILE_TYPES = [
  // Documents & Text
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
  ".rtf",
  ".pages",
  ".numbers",
  // Images
  ".jpeg",
  ".jpg",
  ".png",
  ".gif",
  ".tiff",
  // Presentations & Data
  ".ppt",
  ".pptx",
  ".key",
  // Audio files for clips
  ".mp3",
  ".wav",
  ".m4a",
  ".aac"
];
var FORBIDDEN_FILE_TYPES = [
  ".exe",
  ".bat",
  ".sh",
  ".msi",
  ".js",
  ".php",
  ".html",
  ".css",
  ".zip"
];
var MAX_FILE_SIZE = 250 * 1024 * 1024;
function validateFileType(fileName) {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
  return ACCEPTED_FILE_TYPES.includes(extension);
}
function isForbiddenFileType(fileName) {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
  return FORBIDDEN_FILE_TYPES.includes(extension);
}
function sanitizeFileName(fileName) {
  const sanitized = fileName.replace(/[<>:"/\\|?*]/g, "").replace(/\.\./g, "").replace(/\s+/g, "_").replace(/[^\w\.-]/g, "");
  return sanitized || `file_${Date.now()}`;
}
function getFileExtension(fileName) {
  return fileName.toLowerCase().substring(fileName.lastIndexOf("."));
}
var ObjectStorageService = class {
  constructor() {
  }
  // Gets the public object search paths.
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path) => path.trim()).filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  // Gets the private object directory.
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Search for a public object from the search paths.
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  // Downloads an object to the response.
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      console.log("Downloading file:", file.name);
      const [metadata] = await file.getMetadata();
      console.log("File metadata:", {
        contentType: metadata.contentType,
        size: metadata.size,
        name: metadata.name
      });
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      const headers = {
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      };
      console.log("Setting headers:", headers);
      res.set(headers);
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.on("end", () => {
        console.log("File streaming completed successfully");
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath) {
    console.log("Getting object entity file for path:", objectPath);
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    let entityId = parts.slice(1).join("/");
    console.log("Entity ID extracted:", entityId);
    if (entityId.startsWith("objects/")) {
      entityId = entityId.substring(8);
      console.log("Removed double objects prefix, new entityId:", entityId);
    }
    if (entityId.includes("replit-objstore-")) {
      const { bucketName, objectName } = parseObjectPath(`/${entityId}`);
      console.log("Old format - bucket:", bucketName, "object:", objectName);
      const bucket = objectStorageClient.bucket(bucketName);
      const objectFile = bucket.file(objectName);
      const [exists] = await objectFile.exists();
      if (!exists) {
        throw new ObjectNotFoundError();
      }
      return objectFile;
    } else {
      let entityDir = this.getPrivateObjectDir();
      if (!entityDir.endsWith("/")) {
        entityDir = `${entityDir}/`;
      }
      const objectEntityPath = `${entityDir}${entityId}`;
      console.log("New format - full path:", objectEntityPath);
      const { bucketName, objectName } = parseObjectPath(objectEntityPath);
      console.log("New format - bucket:", bucketName, "object:", objectName);
      const bucket = objectStorageClient.bucket(bucketName);
      const objectFile = bucket.file(objectName);
      const [exists] = await objectFile.exists();
      console.log("New format - file exists:", exists, "for", objectName);
      if (!exists) {
        console.error("File not found in bucket:", bucketName, "object:", objectName);
        throw new ObjectNotFoundError();
      }
      return objectFile;
    }
  }
  normalizeObjectEntityPath(rawPath) {
    console.log("Normalizing path:", rawPath);
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      console.log("Path doesn't start with googleapis, returning as-is:", rawPath);
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    console.log("Extracted pathname:", rawObjectPath);
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    console.log("Private object dir:", objectEntityDir);
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      console.log("Path doesn't start with entity dir, extracting from raw path");
      const pathParts = rawObjectPath.split("/");
      if (pathParts.length >= 3) {
        const entityPath = pathParts.slice(2).join("/");
        return `/objects/${entityPath}`;
      }
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    console.log("Extracted entity ID:", entityId);
    return `/objects/${entityId}`;
  }
  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }
  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission
  }) {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? "read" /* READ */
    });
  }
};
function parseObjectPath(path) {
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
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

export {
  objectStorageClient,
  ObjectNotFoundError,
  ACCEPTED_FILE_TYPES,
  FORBIDDEN_FILE_TYPES,
  MAX_FILE_SIZE,
  validateFileType,
  isForbiddenFileType,
  sanitizeFileName,
  getFileExtension,
  ObjectStorageService
};
