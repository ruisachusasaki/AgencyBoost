import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function ICAgreementTemplates() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [activateTarget, setActivateTarget] = useState<any>(null);

  const templatesQuery = useQuery<any[]>({
    queryKey: ["/api/ic-agreement-templates"],
  });

  const activeQuery = useQuery<any>({
    queryKey: ["/api/ic-agreement-templates/active"],
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["/api/ic-agreement-templates"] });
    qc.invalidateQueries({ queryKey: ["/api/ic-agreement-templates/active"] });
  };

  const activateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/ic-agreement-templates/${id}`, { isActive: true }),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Template activated successfully" });
      setActivateTarget(null);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to activate template" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/ic-agreement-templates/${id}`),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Template deleted" });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Cannot delete", description: err.message || "Failed to delete template" });
      setDeleteTarget(null);
    },
  });

  const templates = templatesQuery.data || [];
  const activeTemplate = activeQuery.data?.template;

  return (
    <div className="space-y-6">
      {activeTemplate ? (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              Active Template: {activeTemplate.name}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/settings/hr/ic-agreement/${activeTemplate.id}`)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            No active IC Agreement template. Offers cannot be sent until an active template is configured.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">IC Agreement Templates</h3>
        <Link href="/settings/hr/ic-agreement/new">
          <Button className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,32%)] text-white">
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {templatesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No templates created yet</p>
              <p className="text-xs mt-1">Create your first IC Agreement template to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t: any) => (
                  <TableRow
                    key={t.id}
                    className={t.isActive ? "bg-[hsl(179,100%,39%)]/5" : ""}
                  >
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      {t.isActive ? (
                        <Badge className="bg-[hsl(179,100%,39%)] text-white hover:bg-[hsl(179,100%,32%)]">Active</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.createdByName || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/settings/hr/ic-agreement/${t.id}`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!t.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActivateTarget(t)}
                            className="text-[hsl(179,100%,39%)]"
                          >
                            Set Active
                          </Button>
                        )}
                        {!t.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(t)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!activateTarget} onOpenChange={() => setActivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Active Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the current active template and make "{activateTarget?.name}" the active template. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => activateTarget && activateMutation.mutate(activateTarget.id)}
              className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,32%)] text-white"
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
