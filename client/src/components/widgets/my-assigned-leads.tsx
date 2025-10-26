import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Trash2, GripVertical } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function MyAssignedLeadsWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-my-assigned-leads" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              My Assigned Leads
            </CardTitle>
            <CardDescription className="text-xs">
              Leads assigned to you
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          data-testid="button-remove-widget"
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {data && data.length > 0 ? (
              data.map((lead: any) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="block mb-2"
                  data-testid={`link-lead-${lead.id}`}
                >
                  <div
                    data-testid={`lead-item-${lead.id}`}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`lead-name-${lead.id}`}>
                          {lead.name}
                        </p>
                        {lead.company && (
                          <p className="text-xs text-muted-foreground truncate">
                            {lead.company}
                          </p>
                        )}
                        {lead.stageName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {lead.stageName}
                          </p>
                        )}
                      </div>
                      {lead.value && (
                        <p className="text-sm font-bold text-primary flex-shrink-0">
                          ${parseFloat(lead.value).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No assigned leads</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
