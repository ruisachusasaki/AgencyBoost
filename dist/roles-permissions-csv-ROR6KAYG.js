import {
  getLegacyPermissionTemplates
} from "./chunk-DE7YTT24.js";
import "./chunk-R5U7XKVJ.js";

// server/lib/roles-permissions-csv.ts
var LEGACY_PERMISSION_TEMPLATES = getLegacyPermissionTemplates();
function buildLabelToKeyMap() {
  const byLabelAndCategory = /* @__PURE__ */ new Map();
  const byLabelOnly = /* @__PURE__ */ new Map();
  for (const module of LEGACY_PERMISSION_TEMPLATES) {
    for (const perm of module.subPermissions) {
      const labelKey = perm.label.toLowerCase().trim();
      const categoryKey = module.label.toLowerCase().trim();
      const compositeKey = `${categoryKey}::${labelKey}`;
      byLabelAndCategory.set(compositeKey, {
        key: perm.key,
        module: module.module
      });
      byLabelOnly.set(labelKey, {
        key: perm.key,
        module: module.module
      });
    }
  }
  return { byLabelAndCategory, byLabelOnly };
}
function getAllPermissionRows() {
  const rows = [];
  for (const module of LEGACY_PERMISSION_TEMPLATES) {
    for (const perm of module.subPermissions) {
      rows.push({
        category: module.label,
        // Human-readable category name (e.g., "Clients", "Marketing")
        description: perm.label,
        // Human-readable description (e.g., "View client list")
        permissionKey: perm.key
        // Internal key (e.g., "clients.view_list")
      });
    }
  }
  return rows;
}
function generateCSV(roles) {
  const permissionRows = getAllPermissionRows();
  const roleNames = roles.map((r) => r.roleName);
  const headers = ["Category", "Permission Description", ...roleNames];
  const dataRows = [];
  for (const row of permissionRows) {
    const rowData = [
      escapeCsvValue(row.category),
      escapeCsvValue(row.description)
    ];
    for (const role of roles) {
      const hasPermission = role.permissions[row.permissionKey] === true;
      rowData.push(hasPermission ? "TRUE" : "FALSE");
    }
    dataRows.push(rowData);
  }
  const allRows = [headers, ...dataRows];
  return allRows.map((row) => row.join(",")).join("\n");
}
function generateTemplateCSV(existingRoleNames = []) {
  const permissionRows = getAllPermissionRows();
  const roleNames = existingRoleNames.length > 0 ? existingRoleNames : ["New Role 1", "New Role 2"];
  const headers = ["Category", "Permission Description", ...roleNames];
  const dataRows = [];
  for (const row of permissionRows) {
    const rowData = [
      escapeCsvValue(row.category),
      escapeCsvValue(row.description)
    ];
    for (const _ of roleNames) {
      rowData.push("FALSE");
    }
    dataRows.push(rowData);
  }
  const allRows = [headers, ...dataRows];
  return allRows.map((row) => row.join(",")).join("\n");
}
function parseCSV(csvContent, existingRoleNames) {
  const errors = [];
  const warnings = [];
  const { byLabelAndCategory, byLabelOnly } = buildLabelToKeyMap();
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return {
      success: false,
      roles: [],
      errors: ["CSV must have at least a header row and one data row"],
      warnings: [],
      newRoles: [],
      existingRoles: []
    };
  }
  const headers = parseCSVRow(lines[0]);
  if (headers.length < 3) {
    return {
      success: false,
      roles: [],
      errors: ["CSV must have at least 3 columns: Category, Permission Description, and at least one role"],
      warnings: [],
      newRoles: [],
      existingRoles: []
    };
  }
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
      existingRoles: []
    };
  }
  const roleNames = headers.slice(2).map((h) => h.trim());
  const newRoles = [];
  const existingRoles = [];
  for (const roleName of roleNames) {
    if (existingRoleNames.includes(roleName)) {
      existingRoles.push(roleName);
    } else {
      newRoles.push(roleName);
    }
  }
  const roleDataMap = /* @__PURE__ */ new Map();
  for (const roleName of roleNames) {
    roleDataMap.set(roleName, {
      roleName,
      permissions: {}
    });
  }
  const seenPermissions = /* @__PURE__ */ new Set();
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
    const compositeKey = `${category.toLowerCase()}::${description.toLowerCase()}`;
    let permInfo = byLabelAndCategory.get(compositeKey);
    if (!permInfo) {
      permInfo = byLabelOnly.get(description.toLowerCase());
    }
    if (!permInfo) {
      errors.push(`Line ${lineNum}: Unknown permission "${description}" (${category}) - this permission does not exist in the system`);
      continue;
    }
    seenPermissions.add(permInfo.key);
    for (let j = 0; j < roleNames.length; j++) {
      const roleName = roleNames[j];
      const valueIndex = j + 2;
      const value = row[valueIndex]?.trim().toUpperCase() || "FALSE";
      const isEnabled = value === "TRUE" || value === "1" || value === "YES";
      const roleData = roleDataMap.get(roleName);
      roleData.permissions[permInfo.key] = isEnabled;
    }
  }
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
    existingRoles
  };
}
function parseCSVRow(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
function escapeCsvValue(value) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
function getAllValidPermissionKeys() {
  const keys = [];
  for (const module of LEGACY_PERMISSION_TEMPLATES) {
    for (const perm of module.subPermissions) {
      keys.push(perm.key);
    }
  }
  return keys;
}
export {
  generateCSV,
  generateTemplateCSV,
  getAllPermissionRows,
  getAllValidPermissionKeys,
  parseCSV
};
