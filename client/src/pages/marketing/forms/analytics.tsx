import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  FileCheck, 
  Calendar,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, format, subDays } from "date-fns";
import type { Form, FormAnalytics } from "@shared/schema";

export default function FormsAnalytics() {
  const [selectedFormId, setSelectedFormId] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Fetch forms for filter dropdown
  const { data: forms = [] } = useQuery<Form[]>({
    queryKey: ["/api/forms"],
  });

  // Fetch analytics data
  const { data: analytics = [], isLoading } = useQuery<FormAnalytics[]>({
    queryKey: ["/api/form-analytics", selectedFormId, dateRange],
    enabled: !!dateRange.from && !!dateRange.to,
  });

  // Calculate totals
  const totalViews = analytics.reduce((sum, item) => sum + item.views, 0);
  const totalSubmissions = analytics.reduce((sum, item) => sum + item.submissions, 0);
  const totalUniqueViews = analytics.reduce((sum, item) => sum + item.uniqueViews, 0);
  const averageCompletionRate = analytics.length > 0 
    ? analytics.reduce((sum, item) => sum + parseFloat(item.completionRate), 0) / analytics.length 
    : 0;

  const selectedForm = forms.find(form => form.id === selectedFormId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Forms Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Track form performance and engagement metrics
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Form</label>
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger className="w-[200px]" data-testid="select-form-filter">
                  <SelectValue placeholder="Select a form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                className="w-[300px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-views">
              {isLoading ? "..." : totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique Views: {isLoading ? "..." : totalUniqueViews.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-submissions">
              {isLoading ? "..." : totalSubmissions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Form completions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-completion-rate">
              {isLoading ? "..." : `${averageCompletionRate.toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Submissions ÷ Views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-conversion-rate">
              {isLoading ? "..." : totalViews > 0 ? `${((totalSubmissions / totalViews) * 100).toFixed(1)}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Form Performance Table */}
      {selectedFormId === "all" && (
        <Card>
          <CardHeader>
            <CardTitle>Form Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading form performance data...</div>
              ) : forms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No forms created yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Form Name</th>
                        <th className="text-right py-2">Views</th>
                        <th className="text-right py-2">Submissions</th>
                        <th className="text-right py-2">Conversion Rate</th>
                        <th className="text-center py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forms.map((form) => {
                        const formAnalytics = analytics.filter(a => a.formId === form.id);
                        const formViews = formAnalytics.reduce((sum, a) => sum + a.views, 0);
                        const formSubmissions = formAnalytics.reduce((sum, a) => sum + a.submissions, 0);
                        const conversionRate = formViews > 0 ? (formSubmissions / formViews) * 100 : 0;
                        
                        return (
                          <tr key={form.id} className="border-b" data-testid={`row-form-${form.id}`}>
                            <td className="py-3 font-medium" data-testid={`text-form-name-${form.id}`}>
                              {form.name}
                            </td>
                            <td className="text-right py-3" data-testid={`text-views-${form.id}`}>
                              {formViews.toLocaleString()}
                            </td>
                            <td className="text-right py-3" data-testid={`text-submissions-${form.id}`}>
                              {formSubmissions.toLocaleString()}
                            </td>
                            <td className="text-right py-3" data-testid={`text-conversion-${form.id}`}>
                              {conversionRate.toFixed(1)}%
                            </td>
                            <td className="text-center py-3">
                              <Badge 
                                variant={form.status === "published" ? "default" : form.status === "draft" ? "secondary" : "outline"}
                                data-testid={`badge-status-${form.id}`}
                              >
                                {form.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Form Details */}
      {selectedFormId !== "all" && selectedForm && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedForm.name} - Detailed Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading detailed analytics...</div>
              ) : analytics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No analytics data available for the selected date range.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {analytics.reduce((sum, a) => sum + a.views, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Views</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.reduce((sum, a) => sum + a.submissions, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Submissions</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.length > 0 
                          ? (analytics.reduce((sum, a) => sum + parseFloat(a.completionRate), 0) / analytics.length).toFixed(1)
                          : "0"
                        }%
                      </div>
                      <div className="text-sm text-muted-foreground">Avg. Completion Rate</div>
                    </div>
                  </div>

                  {/* Daily breakdown would go here with a chart component */}
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    Historical chart visualization would be implemented here
                    <br />
                    <small>Chart library integration pending</small>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading traffic data...</div>
          ) : analytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No traffic data available for the selected period.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {analytics.reduce((sum, a) => sum + a.directTraffic, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Direct</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {analytics.reduce((sum, a) => sum + a.searchTraffic, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Search</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-xl font-bold text-purple-600">
                  {analytics.reduce((sum, a) => sum + a.socialTraffic, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Social</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-xl font-bold text-orange-600">
                  {analytics.reduce((sum, a) => sum + a.referralTraffic, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Referral</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}