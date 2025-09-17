/**
 * CSV Export Utilities for Time Tracking Reports
 * Provides functions for generating CSV exports in various formats for accounting team
 */

export interface TimeEntry {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  duration: number;
  description: string;
  billable: boolean;
  hourlyRate?: number;
}

export interface TaskWithTimeData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  clientId?: string;
  timeEntriesByDate: Record<string, TimeEntry[]>;
  totalTracked: number;
}

export interface UserSummary {
  userId: string;
  userName: string;
  userRole: string;
  totalTime: number;
  tasksWorked: number;
  dailyTotals: Record<string, number>;
}

export interface ClientBreakdown {
  clientId: string;
  clientName: string;
  totalTime: number;
  tasksCount: number;
  users: UserSummary[];
}

export interface TimeTrackingReportData {
  tasks: TaskWithTimeData[];
  userSummaries: UserSummary[];
  clientBreakdowns: ClientBreakdown[];
  grandTotal: number;
}

export interface ExportFilters {
  dateFrom: string;
  dateTo: string;
  userId?: string;
  clientId?: string;
  reportType: string;
}

/**
 * Escapes CSV field values to handle commas, quotes, and newlines
 */
function escapeCsvField(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // If field contains comma, double quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Formats duration from seconds to decimal hours or friendly format
 */
function formatHours(seconds: number, mode: 'friendly' | 'decimal' = 'decimal'): string {
  if (mode === 'decimal') {
    return (seconds / 3600).toFixed(2);
  }
  
  // Friendly format
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Formats date to YYYY-MM-DD format
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toISOString().split('T')[0];
}

/**
 * Formats time to HH:MM format
 */
function formatTime(dateString: string): string {
  return new Date(dateString).toTimeString().slice(0, 5);
}

/**
 * Generates detailed timesheet CSV with all time entries
 */
export function generateDetailedTimesheetCSV(
  data: TimeTrackingReportData,
  filters: ExportFilters,
  clientsList: Array<{id: string; name: string}> = [],
  timeFormat: 'friendly' | 'decimal' = 'decimal'
): string {
  const headers = [
    'Date',
    'User Name',
    'User Role',
    'Client',
    'Task Title', 
    'Task Description',
    'Start Time',
    'End Time',
    'Hours',
    'Billable',
    'Hourly Rate',
    'Entry Description',
    'Task Status',
    'Task Priority'
  ];

  const rows: string[][] = [];
  
  // Add header row
  rows.push(headers);
  
  // Process each task and its time entries
  data.tasks.forEach(task => {
    const clientName = clientsList.find(c => c.id === task.clientId)?.name || task.clientId || 'Unknown Client';
    const userSummary = data.userSummaries.find(u => u.userId === task.assignedTo);
    const userName = userSummary?.userName || 'Unknown User';
    const userRole = userSummary?.userRole || 'Unknown Role';
    
    Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
      entries.forEach(entry => {
        rows.push([
          formatDate(date),
          userName,
          userRole,
          clientName,
          task.title,
          task.description || '',
          formatTime(entry.startTime),
          formatTime(entry.endTime),
          formatHours(entry.duration, timeFormat),
          entry.billable ? 'Yes' : 'No',
          entry.hourlyRate?.toString() || '',
          entry.description || '',
          task.status,
          task.priority
        ]);
      });
    });
  });
  
  // Add summary row
  rows.push([]);
  rows.push(['SUMMARY']);
  rows.push(['Total Hours', '', '', '', '', '', '', '', formatHours(data.grandTotal, timeFormat)]);
  rows.push(['Report Period', `${filters.dateFrom} to ${filters.dateTo}`]);
  rows.push(['Generated At', new Date().toISOString().replace('T', ' ').slice(0, 19)]);
  
  // Convert to CSV string
  return rows.map(row => row.map(field => escapeCsvField(field)).join(',')).join('\n');
}

/**
 * Generates user summary CSV with aggregated hours per user
 */
export function generateUserSummaryCSV(
  data: TimeTrackingReportData,
  filters: ExportFilters,
  timeFormat: 'friendly' | 'decimal' = 'decimal'
): string {
  const headers = [
    'User Name',
    'User Role', 
    'Total Hours',
    'Tasks Worked',
    'Average Hours per Task',
    'Most Active Day',
    'Daily Breakdown'
  ];

  const rows: string[][] = [];
  rows.push(headers);
  
  data.userSummaries.forEach(user => {
    const avgHoursPerTask = user.tasksWorked > 0 ? 
      (user.totalTime / 3600 / user.tasksWorked).toFixed(2) : '0.00';
    
    // Find most active day
    const dailyEntries = Object.entries(user.dailyTotals);
    const mostActiveDay = dailyEntries.length > 0 ? 
      dailyEntries.reduce((max, [date, seconds]) => 
        seconds > max.seconds ? { date, seconds } : max, 
        { date: '', seconds: 0 }
      ) : { date: 'N/A', seconds: 0 };
    
    // Create daily breakdown string
    const dailyBreakdown = dailyEntries
      .map(([date, seconds]) => `${formatDate(date)}:${formatHours(seconds, timeFormat)}`)
      .join('; ');
    
    rows.push([
      user.userName,
      user.userRole,
      formatHours(user.totalTime, timeFormat),
      user.tasksWorked.toString(),
      avgHoursPerTask,
      mostActiveDay.date !== 'N/A' ? 
        `${formatDate(mostActiveDay.date)} (${formatHours(mostActiveDay.seconds, timeFormat)})` : 'N/A',
      dailyBreakdown
    ]);
  });
  
  // Add summary
  rows.push([]);
  rows.push(['SUMMARY']);
  rows.push(['Total Users', data.userSummaries.length.toString()]);
  rows.push(['Total Hours', formatHours(data.grandTotal)]);
  rows.push(['Report Period', `${filters.dateFrom} to ${filters.dateTo}`]);
  rows.push(['Generated At', new Date().toISOString().replace('T', ' ').slice(0, 19)]);
  
  return rows.map(row => row.map(field => escapeCsvField(field)).join(',')).join('\n');
}

/**
 * Generates client breakdown CSV with time allocation by client
 */
export function generateClientBreakdownCSV(
  data: TimeTrackingReportData,
  filters: ExportFilters,
  timeFormat: 'friendly' | 'decimal' = 'decimal'
): string {
  const headers = [
    'Client Name',
    'Total Hours',
    'Task Count',
    'Number of Users',
    'Average Hours per Task',
    'User Breakdown',
    'User Hours Detail'
  ];

  const rows: string[][] = [];
  rows.push(headers);
  
  data.clientBreakdowns.forEach(client => {
    const avgHoursPerTask = client.tasksCount > 0 ? 
      (client.totalTime / 3600 / client.tasksCount).toFixed(2) : '0.00';
    
    // Create user breakdown string
    const userBreakdown = client.users
      .map(user => `${user.userName} (${user.userRole})`)
      .join('; ');
    
    const userHoursDetail = client.users
      .map(user => `${user.userName}:${formatHours(user.totalTime, timeFormat)}`)
      .join('; ');
    
    rows.push([
      client.clientName,
      formatHours(client.totalTime, timeFormat),
      client.tasksCount.toString(),
      client.users.length.toString(),
      avgHoursPerTask,
      userBreakdown,
      userHoursDetail
    ]);
  });
  
  // Add summary
  rows.push([]);
  rows.push(['SUMMARY']);
  rows.push(['Total Clients', data.clientBreakdowns.length.toString()]);
  rows.push(['Total Hours', formatHours(data.grandTotal)]);
  rows.push(['Report Period', `${filters.dateFrom} to ${filters.dateTo}`]);
  rows.push(['Generated At', new Date().toISOString().replace('T', ' ').slice(0, 19)]);
  
  return rows.map(row => row.map(field => escapeCsvField(field)).join(',')).join('\n');
}

/**
 * Generates comprehensive admin summary CSV with all metrics
 */
export function generateAdminSummaryCSV(
  data: TimeTrackingReportData,
  filters: ExportFilters,
  clientsList: Array<{id: string; name: string}> = [],
  timeFormat: 'friendly' | 'decimal' = 'decimal'
): string {
  const headers = [
    'Metric Type',
    'Metric Name', 
    'Value',
    'Details'
  ];

  const rows: string[][] = [];
  rows.push(headers);
  
  // Overall metrics
  rows.push(['Overview', 'Total Hours Logged', formatHours(data.grandTotal, timeFormat), '']);
  rows.push(['Overview', 'Total Tasks', data.tasks.length.toString(), '']);
  rows.push(['Overview', 'Total Users', data.userSummaries.length.toString(), '']);
  rows.push(['Overview', 'Total Clients', data.clientBreakdowns.length.toString(), '']);
  rows.push(['Overview', 'Report Period', `${filters.dateFrom} to ${filters.dateTo}`, '']);
  
  // Top performers
  const topUser = data.userSummaries.reduce((max, user) => 
    user.totalTime > max.totalTime ? user : max, data.userSummaries[0] || { totalTime: 0, userName: 'None' });
  const topClient = data.clientBreakdowns.reduce((max, client) => 
    client.totalTime > max.totalTime ? client : max, data.clientBreakdowns[0] || { totalTime: 0, clientName: 'None' });
  
  rows.push(['Top Performers', 'Most Active User', topUser?.userName || 'None', 
    `${formatHours(topUser?.totalTime || 0, timeFormat)}`]);
  rows.push(['Top Performers', 'Highest Client Hours', topClient?.clientName || 'None', 
    `${formatHours(topClient?.totalTime || 0, timeFormat)}`]);
  
  rows.push([]);
  
  // User details
  rows.push(['USER BREAKDOWN']);
  rows.push(['User', 'Role', 'Hours', 'Tasks']);
  data.userSummaries.forEach(user => {
    rows.push(['User Detail', user.userName, formatHours(user.totalTime, timeFormat), user.tasksWorked.toString()]);
  });
  
  rows.push([]);
  
  // Client details
  rows.push(['CLIENT BREAKDOWN']);
  rows.push(['Client', 'Hours', 'Tasks', 'Users']);
  data.clientBreakdowns.forEach(client => {
    rows.push(['Client Detail', client.clientName, formatHours(client.totalTime, timeFormat), 
      client.tasksCount.toString(), client.users.length.toString()]);
  });
  
  rows.push([]);
  rows.push(['Generated At', new Date().toISOString().replace('T', ' ').slice(0, 19)]);
  
  return rows.map(row => row.map(field => escapeCsvField(field)).join(',')).join('\n');
}

/**
 * Downloads CSV content as a file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Generates filename for CSV export
 */
export function generateExportFilename(
  exportType: string,
  dateFrom: string,
  dateTo: string
): string {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
  const dateRange = dateFrom === dateTo ? dateFrom : `${dateFrom}_to_${dateTo}`;
  return `time-tracking-${exportType}-${dateRange}-${timestamp}.csv`;
}

/**
 * Main export function that handles all export types
 */
export function exportTimeTrackingData(
  exportType: 'detailed' | 'user-summary' | 'client-breakdown' | 'admin-summary',
  data: TimeTrackingReportData,
  filters: ExportFilters,
  clientsList: Array<{id: string; name: string}> = [],
  timeFormat: 'friendly' | 'decimal' = 'decimal'
): void {
  let csvContent: string;
  let filename: string;
  
  switch (exportType) {
    case 'detailed':
      csvContent = generateDetailedTimesheetCSV(data, filters, clientsList, timeFormat);
      filename = generateExportFilename('detailed-timesheet', filters.dateFrom, filters.dateTo);
      break;
      
    case 'user-summary':
      csvContent = generateUserSummaryCSV(data, filters, timeFormat);
      filename = generateExportFilename('user-summary', filters.dateFrom, filters.dateTo);
      break;
      
    case 'client-breakdown':
      csvContent = generateClientBreakdownCSV(data, filters, timeFormat);
      filename = generateExportFilename('client-breakdown', filters.dateFrom, filters.dateTo);
      break;
      
    case 'admin-summary':
      csvContent = generateAdminSummaryCSV(data, filters, clientsList, timeFormat);
      filename = generateExportFilename('admin-summary', filters.dateFrom, filters.dateTo);
      break;
      
    default:
      throw new Error(`Unknown export type: ${exportType}`);
  }
  
  downloadCSV(csvContent, filename);
}