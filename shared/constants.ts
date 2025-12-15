// Shared constants for AgencyBoost CRM

// Sales and Quotes Configuration
export const SALES_CONFIG = {
  MINIMUM_MARGIN_THRESHOLD: 35, // Percentage - quotes below this require Sales Manager approval
  DEFAULT_MARKUP: 20, // Default markup percentage for new products
  MAX_QUOTE_VALIDITY_DAYS: 30, // Days before quote expires
} as const;

// Quote Status Types
export const QUOTE_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval", 
  APPROVED: "approved",
  REJECTED: "rejected",
  SENT: "sent",
  ACCEPTED: "accepted",
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  QUOTE_APPROVAL_REQUIRED: "quote_approval_required",
  QUOTE_APPROVED: "quote_approved", 
  QUOTE_REJECTED: "quote_rejected",
  QUOTE_SENT: "quote_sent",
} as const;

// Role Names
export const ROLE_NAMES = {
  ADMIN: "Admin",
  SALES_MANAGER: "Sales Manager",
  SALES_REP: "Sales Rep",
  MANAGER: "Manager",
  USER: "User",
  ACCOUNTING: "Accounting",
} as const;