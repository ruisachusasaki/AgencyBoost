// Shared utility functions for client data processing

export interface CustomField {
  id: string;
  name: string;
  type: string;
}

/**
 * Computes a display name from custom field values
 * Falls back to database name/email if no custom fields match
 */
export function computeClientDisplayName(
  customFieldValues: Record<string, any> | null,
  customFields: CustomField[],
  fallbackName?: string,
  fallbackEmail?: string
): string {
  if (!customFieldValues || !customFields || customFields.length === 0) {
    return fallbackName || fallbackEmail || "Unnamed Client";
  }

  // Find First Name and Last Name fields by exact name match (case insensitive)
  const firstNameField = customFields.find(field => 
    field.name.toLowerCase() === 'first name' || 
    field.name.toLowerCase() === 'firstname' || 
    field.name.toLowerCase() === 'first_name'
  );
  
  const lastNameField = customFields.find(field => 
    field.name.toLowerCase() === 'last name' || 
    field.name.toLowerCase() === 'lastname' || 
    field.name.toLowerCase() === 'last_name'
  );

  const firstName = firstNameField ? (customFieldValues[firstNameField.id] || "").toString().trim() : "";
  const lastName = lastNameField ? (customFieldValues[lastNameField.id] || "").toString().trim() : "";

  // If we have both first and last name from custom fields, use them
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  
  // If we only have first name, use it
  if (firstName) {
    return firstName;
  }
  
  // If we only have last name, use it
  if (lastName) {
    return lastName;
  }

  // Otherwise fall back to database name or email
  return fallbackName || fallbackEmail || "Unnamed Client";
}

/**
 * Computes a business display name from custom field values
 * Falls back to company field if no custom fields match
 */
export function computeBusinessDisplayName(
  customFieldValues: Record<string, any> | null,
  customFields: CustomField[],
  fallbackCompany?: string
): string {
  if (!customFieldValues || !customFields || customFields.length === 0) {
    return fallbackCompany || "";
  }

  // Find Business Name or Company Name field
  const businessNameField = customFields.find(field => 
    field.name.toLowerCase() === 'business name' || 
    field.name.toLowerCase() === 'company name' || 
    field.name.toLowerCase() === 'company' ||
    field.name.toLowerCase() === 'business_name' ||
    field.name.toLowerCase() === 'company_name'
  );

  const businessName = businessNameField ? (customFieldValues[businessNameField.id] || "").toString().trim() : "";

  return businessName || fallbackCompany || "";
}