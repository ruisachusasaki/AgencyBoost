/**
 * CSV Import/Export utilities for Roles and Permissions
 * 
 * The CSV format dynamically reads from LEGACY_PERMISSION_TEMPLATES, so any new permissions
 * added to the system automatically appear in exports.
 * 
 * CSV Format:
 * - Row 1: Headers - "Category", "Permission Description", then one column per role
 * - Rows 2+: One row per permission, with TRUE/FALSE for each role
 */

import { getLegacyPermissionTemplates, type LegacyPermissionModule, type SubPermission } from "@shared/permission-templates";

// Get flattened permission templates for backward compatibility
const LEGACY_PERMISSION_TEMPLATES = getLegacyPermissionTemplates();

export interface RolePermissionData {
  roleName: string;
  permissions: { [permissionKey: string]: boolean };
}

export interface CSVParseResult {
  success: boolean;
  roles: RolePermissionData[];
  errors: string[];
  warnings: string[];
  newRoles: string[];
  existingRoles: string[];
}

export interface PermissionRow {
  category: string;
  description: string;
  permissionKey: string;
}

/**
 * Build a mapping from permission label (description) to permission key
 * This allows CSV to use human-readable labels while we map to internal keys
 * 
 * Uses both category+label as primary key to handle duplicate labels across modules
 * Falls back to label-only lookup for backward compatibility
 */
function buildLabelToKeyMap(): { 
  byLabelAndCategory: Map<string, { key: string; module: string }>;
  byLabelOnly: Map<string, { key: string; module: string }>;
} {
  const byLabelAndCategory = new Map<string, { key: string; module: string }>();
  const byLabelOnly = new Map<string, { key: string; module: string }>();
  
  for (const module of LEGACY_PERMISSION_TEMPLATES) {
    for (const perm of module.subPermissions) {
      const labelKey = perm.label.toLowerCase().trim();
      const categoryKey = module.label.toLowerCase().trim();
      const compositeKey = `${categoryKey}::${labelKey}`;
      
      // Store with composite key (category + label) - handles duplicates correctly
      byLabelAndCategory.set(compositeKey, { 
        key: perm.key, 
        module: module.module 
      });
      
      // Also store by label only for backward compatibility (last one wins for duplicates)
      byLabelOnly.set(labelKey, { 
        key: perm.key, 
        module: module.module 
      });
    }
  }
  
  return { byLabelAndCategory, byLabelOnly };
}

/**
 * Build a mapping from permission key to permission info
 */
function buildKeyToInfoMap(): Map<string, { label: string; module: string; category: string }> {
  const map = new Map<string, { label: string; module: string; category: string }>();
  
  for (const module of LEGACY_PERMISSION_TEMPLATES) {
    for (const perm of module.subPermissions) {
      map.set(perm.key, {
        label: perm.label,
        module: module.module,
        category: module.label, // Human-readable category name
      });
    }
  }
  
  return map;
}

/**
 * Get all permission rows from LEGACY_PERMISSION_TEMPLATES
 * Returns them in order, grouped by category
 */
export function getAllPermissionRows(): PermissionRow[] {
  const rows: PermissionRow[] = [];
  
  for (const module of LEGACY_PERMISSION_TEMPLATES) {
    for (const perm of module.subPermissions) {
      rows.push({
        category: module.label, // Human-readable category name (e.g., "Clients", "Marketing")
        description: perm.label, // Human-readable description (e.g., "View client list")
        permissionKey: perm.key, // Internal key (e.g., "clients.view_list")
      });
    }
  }
  
  return rows;
}

/**
 * Generate CSV content from current roles and their permissions
 */
export function generateCSV(roles: RolePermissionData[]): string {
  const permissionRows = getAllPermissionRows();
  const roleNames = roles.map(r => r.roleName);
  
  // Build header row
  const headers = ["Category", "Permission Description", ...roleNames];
  
  // Build data rows
  const dataRows: string[][] = [];
  for (const row of permissionRows) {
    const rowData: string[] = [
      escapeCsvValue(row.category),
      escapeCsvValue(row.description),
    ];
    
    // Add TRUE/FALSE for each role
    for (const role of roles) {
      const hasPermission = role.permissions[row.permissionKey] === true;
      rowData.push(hasPermission ? "TRUE" : "FALSE");
    }
    
    dataRows.push(rowData);
  }
  
  // Combine into CSV
  const allRows = [headers, ...dataRows];
  return allRows.map(row => row.join(",")).join("\n");
}

/**
 * Generate a blank CSV template (all permissions listed, no roles or empty roles)
 * If existingRoles is provided, includes those roles with all FALSE values
 */
export function generateTemplateCSV(existingRoleNames: string[] = []): string {
  const permissionRows = getAllPermissionRows();
  
  // If no existing roles, create template with sample role columns
  const roleNames = existingRoleNames.length > 0 
    ? existingRoleNames 
    : ["New Role 1", "New Role 2"];
  
  // Build header row
  const headers = ["Category", "Permission Description", ...roleNames];
  
  // Build data rows with all FALSE
  const dataRows: string[][] = [];
  for (const row of permissionRows) {
    const rowData: string[] = [
      escapeCsvValue(row.category),
      escapeCsvValue(row.description),
    ];
    
    // All FALSE for template
    for (const _ of roleNames) {
      rowData.push("FALSE");
    }
    
    dataRows.push(rowData);
  }
  
  // Combine into CSV
  const allRows = [headers, ...dataRows];
  return allRows.map(row => row.join(",")).join("\n");
}

/**
 * Parse CSV content and validate against LEGACY_PERMISSION_TEMPLATES
 */
export function parseCSV(csvContent: string, existingRoleNames: string[]): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { byLabelAndCategory, byLabelOnly } = buildLabelToKeyMap();
  
  // Parse CSV lines
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    return {
      success: false,
      roles: [],
      errors: ["CSV must have at least a header row and one data row"],
      warnings: [],
      newRoles: [],
      existingRoles: [],
    };
  }
  
  // Parse header row
  const headers = parseCSVRow(lines[0]);
  if (headers.length < 3) {
    return {
      success: false,
      roles: [],
      errors: ["CSV must have at least 3 columns: Category, Permission Description, and at least one role"],
      warnings: [],
      newRoles: [],
      existingRoles: [],
    };
  }
  
  // Validate first two headers
  if (headers[0].toLowerCase().trim() !== "category") {
    errors.push(`First column must be "Category", found "${headers[0]}"`);
  }
  if (headers[1].toLowerCase().trim() !== "permission description") {
    errors.push(`Second column must be "Permission Description", found "${headers[1]}"`);
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      roles: [],
      errors,
      warnings,
      newRoles: [],
      existingRoles: [],
    };
  }
  
  // Extract role names from headers
  const roleNames = headers.slice(2).map(h => h.trim());
  const newRoles: string[] = [];
  const existingRoles: string[] = [];
  
  for (const roleName of roleNames) {
    if (existingRoleNames.includes(roleName)) {
      existingRoles.push(roleName);
    } else {
      newRoles.push(roleName);
    }
  }
  
  // Initialize role data
  const roleDataMap = new Map<string, RolePermissionData>();
  for (const roleName of roleNames) {
    roleDataMap.set(roleName, {
      roleName,
      permissions: {},
    });
  }
  
  // Track which permissions we've seen
  const seenPermissions = new Set<string>();
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    const lineNum = i + 1;
    
    if (row.length < roleNames.length + 2) {
      warnings.push(`Line ${lineNum}: Row has fewer columns than expected, some roles may not be updated`);
    }
    
    const category = row[0]?.trim() || "";
    const description = row[1]?.trim() || "";
    
    if (!description) {
      warnings.push(`Line ${lineNum}: Empty permission description, skipping row`);
      continue;
    }
    
    // Look up the permission key - try category+label first, then label-only
    const compositeKey = `${category.toLowerCase()}::${description.toLowerCase()}`;
    let permInfo = byLabelAndCategory.get(compositeKey);
    
    // Fallback to label-only lookup for backward compatibility
    if (!permInfo) {
      permInfo = byLabelOnly.get(description.toLowerCase());
    }
    
    if (!permInfo) {
      errors.push(`Line ${lineNum}: Unknown permission "${description}" (${category}) - this permission does not exist in the system`);
      continue;
    }
    
    seenPermissions.add(permInfo.key);
    
    // Parse TRUE/FALSE values for each role
    for (let j = 0; j < roleNames.length; j++) {
      const roleName = roleNames[j];
      const valueIndex = j + 2;
      const value = row[valueIndex]?.trim().toUpperCase() || "FALSE";
      
      const isEnabled = value === "TRUE" || value === "1" || value === "YES";
      
      const roleData = roleDataMap.get(roleName)!;
      roleData.permissions[permInfo.key] = isEnabled;
    }
  }
  
  // Check for any permissions in the system that weren't in the CSV
  const allSystemPermissions = getAllPermissionRows();
  for (const perm of allSystemPermissions) {
    if (!seenPermissions.has(perm.permissionKey)) {
      warnings.push(`Permission "${perm.description}" (${perm.category}) was not found in CSV - will remain unchanged for existing roles, will be FALSE for new roles`);
    }
  }
  
  return {
    success: errors.length === 0,
    roles: Array.from(roleDataMap.values()),
    errors,
    warnings,
    newRoles,
    existingRoles,
  };
}

/**
 * Parse a single CSV row, handling quoted values
 */
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Escape a value for CSV output
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Get all valid permission keys from LEGACY_PERMISSION_TEMPLATES
 */
export function getAllValidPermissionKeys(): string[] {
  const keys: string[] = [];
  for (const module of LEGACY_PERMISSION_TEMPLATES) {
    for (const perm of module.subPermissions) {
      keys.push(perm.key);
    }
  }
  return keys;
}
