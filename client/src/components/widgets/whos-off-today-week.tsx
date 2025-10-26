import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trash2, GripVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function WhosOffTodayWeekWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-whos-off" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Who's Off Today/This Week
            </CardTitle>
            <CardDescription className="text-xs">
              Team members on PTO
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
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="today" data-testid="tab-today">Today</TabsTrigger>
              <TabsTrigger value="week" data-testid="tab-week">This Week</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="space-y-2 max-h-[300px] overflow-y-auto">
              {data?.today && data.today.length > 0 ? (
                data.today.map((staff: any) => (
                  <div
                    key={staff.id}
                    data-testid={`off-today-${staff.staffId}`}
                    className="p-2 border rounded-lg"
                  >
                    <p className="font-medium text-sm">{staff.staffName}</p>
                    <p className="text-xs text-muted-foreground">{staff.type}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No one is off today</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="week" className="space-y-2 max-h-[300px] overflow-y-auto">
              {data?.thisWeek && data.thisWeek.length > 0 ? (
                data.thisWeek.map((staff: any) => (
                  <div
                    key={staff.id}
                    data-testid={`off-week-${staff.staffId}`}
                    className="p-2 border rounded-lg"
                  >
                    <p className="font-medium text-sm">{staff.staffName}</p>
                    <p className="text-xs text-muted-foreground">{staff.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(staff.startDate), 'MMM d')} - {format(new Date(staff.endDate), 'MMM d')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No one is off this week</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
