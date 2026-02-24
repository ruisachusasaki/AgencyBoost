import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Archive, RefreshCw, Trash2, Users, FileText, BarChart, Heart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@shared/schema";

interface ClientDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: { id: string; name: string } | null;
  onSuccess: () => void;
}

interface RelationsCounts {
  tasks: number;
  campaigns: number;
  invoices: number;
  healthScores: number;
}

export function ClientDeletionModal({ isOpen, onClose, client, onSuccess }: ClientDeletionModalProps) {
  const [selectedAction, setSelectedAction] = useState<'archive' | 'reassign' | 'delete' | null>(null);
  const [selectedTargetClient, setSelectedTargetClient] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedAction(null);
      setSelectedTargetClient("");
    }
  }, [isOpen]);

  // Fetch relation counts for the client
  const { data: relationsCounts, isLoading: isLoadingCounts } = useQuery({
    queryKey: [`/api/clients/${client?.id}/relations-counts`],
    enabled: isOpen && !!client?.id,
  });

  // Fetch all clients for reassignment dropdown (excluding the current client)
  const { data: allClientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients/all-for-reassignment"],
    queryFn: async () => {
      // Fetch all clients (not paginated) for reassignment dropdown
      return await apiRequest("GET", "/api/clients?limit=1000&page=1");
    },
    enabled: isOpen && selectedAction === 'reassign',
  });

  const availableClients = allClientsData?.clients?.filter((c: Client) => c.id !== client?.id && !c.isArchived) || [];

  // Archive client mutation
  const archiveClientMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/clients/${id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client archived",
        variant: "default",
        description: "The client has been successfully archived and removed from the main list.",
      });
      onSuccess();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive client. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reassign tasks mutation
  const reassignTasksMutation = useMutation({
    mutationFn: async ({ fromClientId, toClientId }: { fromClientId: string; toClientId: string }) => {
      return await apiRequest("POST", `/api/clients/${fromClientId}/reassign-tasks`, { toClientId });
    },
    onSuccess: async (data) => {
      // Invalidate both client lists and relations counts
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${client?.id}/relations-counts`] });
      
      // Refetch relations counts immediately to update UI
      await queryClient.refetchQueries({ queryKey: [`/api/clients/${client?.id}/relations-counts`] });
      
      toast({
        title: "Tasks reassigned",
        variant: "default",
        description: `Successfully reassigned ${data.movedCount} tasks. You can now delete the client if needed.`,
      });
      // After successful reassignment, automatically select delete action
      setSelectedAction('delete');
      setSelectedTargetClient("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reassign tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client deleted",
        variant: "default",
        description: "The client has been permanently deleted.",
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      if (error?.status === 409) {
        toast({
          title: "Cannot delete client",
          description: error.message || "Client has associated records. Please archive or reassign tasks first.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete client. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleAction = () => {
    if (!client?.id || !selectedAction) return;

    switch (selectedAction) {
      case 'archive':
        archiveClientMutation.mutate(client.id);
        break;
      case 'reassign':
        if (!selectedTargetClient) {
          toast({
            title: "Error",
            description: "Please select a target client for task reassignment.",
            variant: "destructive",
          });
          return;
        }
        reassignTasksMutation.mutate({
          fromClientId: client.id,
          toClientId: selectedTargetClient,
        });
        break;
      case 'delete':
        deleteClientMutation.mutate(client.id);
        break;
    }
  };

  const isActionInProgress = archiveClientMutation.isPending || reassignTasksMutation.isPending || deleteClientMutation.isPending;
  const totalRelations = relationsCounts ? relationsCounts.tasks + relationsCounts.campaigns + relationsCounts.invoices + relationsCounts.healthScores : 0;
  const canHardDelete = totalRelations === 0;

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Manage Client: {client.company || client.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Relations Summary */}
          {isLoadingCounts ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading client information...
            </div>
          ) : relationsCounts && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Associated Records</CardTitle>
                <CardDescription>This client has the following associated data:</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Tasks:</span>
                    <Badge variant={relationsCounts.tasks > 0 ? "default" : "secondary"}>
                      {relationsCounts.tasks}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Campaigns:</span>
                    <Badge variant={relationsCounts.campaigns > 0 ? "default" : "secondary"}>
                      {relationsCounts.campaigns}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Invoices:</span>
                    <Badge variant={relationsCounts.invoices > 0 ? "default" : "secondary"}>
                      {relationsCounts.invoices}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Health Scores:</span>
                    <Badge variant={relationsCounts.healthScores > 0 ? "default" : "secondary"}>
                      {relationsCounts.healthScores}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Choose an action:</h3>
            
            <div className="grid gap-3">
              {/* Archive Option - Always available and recommended */}
              <Card 
                className={`cursor-pointer transition-colors border-2 ${
                  selectedAction === 'archive' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedAction('archive')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Archive className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Archive Client</h4>
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Hide the client from the main list while preserving all data and relationships. 
                        You can restore archived clients later if needed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reassign Tasks Option - Only if tasks exist */}
              {relationsCounts && relationsCounts.tasks > 0 && (
                <Card 
                  className={`cursor-pointer transition-colors border-2 ${
                    selectedAction === 'reassign' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedAction('reassign')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <RefreshCw className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium">Reassign Tasks</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Move all {relationsCounts.tasks} tasks to another client. 
                          This allows you to delete the client afterward while preserving task history.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Hard Delete Option - Only if no relations or after reassignment */}
              <Card 
                className={`cursor-pointer transition-colors border-2 ${
                  selectedAction === 'delete' 
                    ? 'border-destructive bg-destructive/5' 
                    : canHardDelete 
                      ? 'border-border hover:border-destructive/50' 
                      : 'border-muted bg-muted/30 cursor-not-allowed'
                }`}
                onClick={() => canHardDelete && setSelectedAction('delete')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Trash2 className={`h-5 w-5 mt-0.5 ${canHardDelete ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${canHardDelete ? 'text-foreground' : 'text-muted-foreground'}`}>
                          Permanently Delete
                        </h4>
                        {!canHardDelete && (
                          <Badge variant="destructive" className="text-xs">Blocked</Badge>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${canHardDelete ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        {canHardDelete 
                          ? "Permanently remove the client and all associated data. This action cannot be undone."
                          : "Cannot delete while the client has associated records. Archive or reassign tasks first."
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Target Client Selection for Reassignment */}
            {selectedAction === 'reassign' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select target client:</label>
                <Select value={selectedTargetClient} onValueChange={setSelectedTargetClient}>
                  <SelectTrigger data-testid="select-target-client">
                    <SelectValue placeholder="Choose a client to receive the tasks" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingClients ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading clients...</div>
                    ) : availableClients.length > 0 ? (
                      availableClients.map((targetClient: Client) => (
                        <SelectItem key={targetClient.id} value={targetClient.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {targetClient.name} {targetClient.company && `(${targetClient.company})`}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No other clients available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isActionInProgress}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={!selectedAction || isActionInProgress || (selectedAction === 'reassign' && !selectedTargetClient)}
            variant={selectedAction === 'delete' ? 'destructive' : 'default'}
            data-testid="button-confirm-action"
          >
            {isActionInProgress ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : selectedAction === 'archive' ? (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archive Client
              </>
            ) : selectedAction === 'reassign' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reassign Tasks
              </>
            ) : selectedAction === 'delete' ? (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </>
            ) : (
              'Select an action'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
