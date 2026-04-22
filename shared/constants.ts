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

// Job Application Stages — single source of truth for HR application status workflow.
// Used by: applicant detail status dropdown, HR applications board, and the
// "Job Application Status Updated" workflow trigger config (To Status / From Status).
// Add a new stage here and it will appear everywhere automatically.
export const JOB_APPLICATION_STAGES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "new", label: "New" },
  { value: "review", label: "Review" },
  { value: "interview", label: "Interview" },
  { value: "not_selected", label: "Not Selected" },
  { value: "test_sent", label: "Test Sent" },
  { value: "send_offer", label: "Send Offer" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "offer_accepted", label: "Offer Accepted" },
  { value: "offer_declined", label: "Offer Declined" },
  { value: "hired", label: "Hired" },
] as const;

export const JOB_APPLICATION_STAGE_VALUES: string[] = JOB_APPLICATION_STAGES.map(s => s.value);

export const JOB_APPLICATION_STAGE_LABELS: Record<string, string> =
  JOB_APPLICATION_STAGES.reduce((acc, s) => {
    acc[s.value] = s.label;
    return acc;
  }, {} as Record<string, string>);

// Role Names
export const ROLE_NAMES = {
  ADMIN: "Admin",
  SALES_MANAGER: "Sales Manager",
  SALES_REP: "Sales Rep",
  MANAGER: "Manager",
  USER: "User",
  ACCOUNTING: "Accounting",
} as const;