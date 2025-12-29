import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Trash2, GripVertical, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function RecentClientsWidget({ userWidget, onRemove }: WidgetProps) {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-recent-clients" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Recent Clients
            </CardTitle>
            <CardDescription className="text-xs">
              Latest 5 clients added
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/clients">
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-link-clients-page"
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            data-testid="button-remove-widget"
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : clients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No clients yet
          </p>
        ) : (
          <div className="space-y-2">
            {clients.map((client: any) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div
                  className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                  data-testid={`client-item-${client.id}`}
                >
                  <div>
                    <p className="text-sm font-medium">{client.company || client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
