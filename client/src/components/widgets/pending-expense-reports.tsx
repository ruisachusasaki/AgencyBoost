import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Trash2, GripVertical } from "lucide-react";
import { format } from "date-fns";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function PendingExpenseReportsWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-pending-expense-reports" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Pending Expense Reports
            </CardTitle>
            <CardDescription className="text-xs">
              Expense submissions awaiting approval
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
              data.map((expense: any) => (
                <div
                  key={expense.id}
                  data-testid={`expense-report-${expense.id}`}
                  className="p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" data-testid={`expense-submitter-${expense.id}`}>
                        {expense.submitterName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {expense.formData?.expense_type || 'Expense Type Not Specified'}
                      </p>
                      {expense.formData?.expense_total && (
                        <p className="text-xs font-medium text-primary mt-1">
                          ${parseFloat(expense.formData.expense_total).toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(expense.submittedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending expense reports</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
