import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useHasPermission } from "@/hooks/use-has-permission";
import { Mail, Plus, Trash2, RefreshCcw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmailLoggingSettings {
  id: string;
  enabled: boolean;
  initialLookbackDays: number;
  excludePromotions: boolean;
  excludeSocial: boolean;
  excludeUpdates: boolean;
  excludeSpam: boolean;
  excludeTrash: boolean;
  storeBodyText: boolean;
  storeBodyHtml: boolean;
  updatedAt: string;
}

interface DomainRule {
  id: string;
  domain: string;
  ruleType: "include" | "exclude";
  notes: string | null;
}

interface EmailExclusion {
  id: string;
  email: string;
  notes: string | null;
}

interface ConnectionStatus {
  id: string;
  email: string;
  userId: string;
  syncEnabled: boolean;
  lastSyncedAt: string | null;
  syncStatus: "idle" | "in_progress" | "success" | "failed" | null;
  lastSyncError: string | null;
  emailsLogged: number;
  emailsScanned: number;
  // Live progress for the in-flight run (reset to 0 each run; updated per page).
  currentRunScanned: number;
  currentRunLogged: number;
  lastSyncStarted: string | null;
  initialSyncCompleted: boolean;
  firstName: string | null;
  lastName: string | null;
}

export default function EmailLoggingSettings() {
  const { toast } = useToast();
  const { hasPermission: canManage } = useHasPermission("settings.email_logging.manage");

  const { data, isLoading } = useQuery<{
    settings: EmailLoggingSettings;
    domainRules: DomainRule[];
    exclusions: EmailExclusion[];
  }>({
    queryKey: ["/api/settings/email-logging"],
  });

  const { data: connData } = useQuery<{ connections: ConnectionStatus[] }>({
    queryKey: ["/api/settings/email-logging/connections"],
    // Poll faster when at least one mailbox is mid-sync so admins see live
    // progress tick up; slower otherwise to keep the page light.
    refetchInterval: (q) =>
      q.state.data?.connections?.some((c) => c.syncStatus === "in_progress")
        ? 5_000
        : 30_000,
  });

  const [newDomain, setNewDomain] = useState("");
  const [newDomainRuleType, setNewDomainRuleType] = useState<"include" | "exclude">("exclude");
  const [newEmail, setNewEmail] = useState("");

  const updateSettings = useMutation({
    mutationFn: async (patch: Partial<EmailLoggingSettings>) => {
      return apiRequest("PUT", "/api/settings/email-logging", patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/email-logging"] });
      toast({ title: "Settings updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e?.message, variant: "destructive" }),
  });

  const addDomainRule = useMutation({
    mutationFn: async (payload: { domain: string; ruleType: string }) => {
      return apiRequest("POST", "/api/settings/email-logging/domain-rules", payload);
    },
    onSuccess: () => {
      setNewDomain("");
      queryClient.invalidateQueries({ queryKey: ["/api/settings/email-logging"] });
    },
    onError: (e: any) => toast({ title: "Failed to add domain", description: e?.message, variant: "destructive" }),
  });

  const removeDomainRule = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/settings/email-logging/domain-rules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/settings/email-logging"] }),
  });

  const addExclusion = useMutation({
    mutationFn: async (payload: { email: string }) => {
      return apiRequest("POST", "/api/settings/email-logging/exclusions", payload);
    },
    onSuccess: () => {
      setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/settings/email-logging"] });
    },
    onError: (e: any) => toast({ title: "Failed to add exclusion", description: e?.message, variant: "destructive" }),
  });

  const removeExclusion = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/settings/email-logging/exclusions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/settings/email-logging"] }),
  });

  if (isLoading || !data) {
    return <div className="p-6">Loading…</div>;
  }

  const s = data.settings;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" /> Email Logging
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Connect staff Gmail accounts to automatically log emails against the right client.
        </p>
      </div>

      {/* Master switch + lookback */}
      <Card>
        <CardHeader>
          <CardTitle>Master controls</CardTitle>
          <CardDescription>
            Disabling pauses background syncs across all connected Gmail accounts. Existing data is retained.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled" className="flex flex-col">
              <span>Email logging enabled</span>
              <span className="text-sm text-gray-500">When off, no new mail is fetched from any inbox.</span>
            </Label>
            <Switch
              id="enabled"
              checked={s.enabled}
              disabled={!canManage}
              onCheckedChange={(checked) => updateSettings.mutate({ enabled: checked })}
              data-testid="switch-enabled"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lookback">Initial lookback (days)</Label>
              <Input
                id="lookback"
                type="number"
                min={1}
                max={365}
                defaultValue={s.initialLookbackDays}
                disabled={!canManage}
                onBlur={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isFinite(v) && v !== s.initialLookbackDays) {
                    updateSettings.mutate({ initialLookbackDays: v });
                  }
                }}
                data-testid="input-lookback"
              />
              <p className="text-xs text-gray-500 mt-1">How far back to scan when a new mailbox is connected.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category exclusions */}
      <Card>
        <CardHeader>
          <CardTitle>Category exclusions</CardTitle>
          <CardDescription>Skip Gmail messages tagged as Promotions, Social, Updates, Spam or Trash.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {([
            ["excludePromotions", "Promotions"],
            ["excludeSocial", "Social"],
            ["excludeUpdates", "Updates"],
            ["excludeSpam", "Spam"],
            ["excludeTrash", "Trash"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={`opt-${key}`}>{label}</Label>
              <Switch
                id={`opt-${key}`}
                checked={s[key as keyof EmailLoggingSettings] as boolean}
                disabled={!canManage}
                onCheckedChange={(checked) => updateSettings.mutate({ [key]: checked } as any)}
                data-testid={`switch-${key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Body storage */}
      <Card>
        <CardHeader>
          <CardTitle>Body storage</CardTitle>
          <CardDescription>Choose what email body content to persist.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="storeBodyText">Store plain text body</Label>
            <Switch
              id="storeBodyText"
              checked={s.storeBodyText}
              disabled={!canManage}
              onCheckedChange={(checked) => updateSettings.mutate({ storeBodyText: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="storeBodyHtml">Store HTML body</Label>
            <Switch
              id="storeBodyHtml"
              checked={s.storeBodyHtml}
              disabled={!canManage}
              onCheckedChange={(checked) => updateSettings.mutate({ storeBodyHtml: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Domain rules */}
      <Card>
        <CardHeader>
          <CardTitle>Domain rules</CardTitle>
          <CardDescription>
            Always include or always exclude messages from specific domains. Useful for partner agencies, vendors,
            or noisy notification senders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage && (
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                placeholder="e.g. example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                data-testid="input-new-domain"
              />
              <Select value={newDomainRuleType} onValueChange={(v) => setNewDomainRuleType(v as any)}>
                <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclude">Exclude</SelectItem>
                  <SelectItem value="include">Include</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => newDomain.trim() && addDomainRule.mutate({ domain: newDomain.trim().toLowerCase(), ruleType: newDomainRuleType })}
                disabled={!newDomain.trim() || addDomainRule.isPending}
                data-testid="button-add-domain"
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          )}
          <div className="space-y-2">
            {data.domainRules.length === 0 && (
              <p className="text-sm text-gray-500">No domain rules configured.</p>
            )}
            {data.domainRules.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant={r.ruleType === "exclude" ? "destructive" : "default"}>
                    {r.ruleType}
                  </Badge>
                  <span className="font-mono">{r.domain}</span>
                </div>
                {canManage && (
                  <Button variant="ghost" size="sm" onClick={() => removeDomainRule.mutate(r.id)} data-testid={`button-remove-domain-${r.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email-level exclusions */}
      <Card>
        <CardHeader>
          <CardTitle>Email exclusions</CardTitle>
          <CardDescription>Skip specific email addresses (bots, internal aliases, etc.).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage && (
            <div className="flex gap-2">
              <Input
                placeholder="noreply@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                data-testid="input-new-exclusion"
              />
              <Button
                onClick={() => newEmail.trim() && addExclusion.mutate({ email: newEmail.trim().toLowerCase() })}
                disabled={!newEmail.trim() || addExclusion.isPending}
                data-testid="button-add-exclusion"
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          )}
          <div className="space-y-2">
            {data.exclusions.length === 0 && <p className="text-sm text-gray-500">No exclusions configured.</p>}
            {data.exclusions.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 border rounded">
                <span className="font-mono">{r.email}</span>
                {canManage && (
                  <Button variant="ghost" size="sm" onClick={() => removeExclusion.mutate(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connections overview */}
      <Card>
        <CardHeader>
          <CardTitle>Connected mailboxes</CardTitle>
          <CardDescription>
            Each staff member can connect their own Gmail from My Profile. Sync runs every 2 minutes in the background.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(connData?.connections || []).length === 0 ? (
            <p className="text-sm text-gray-500">No mailboxes connected yet.</p>
          ) : (
            <div className="space-y-3">
              {(connData?.connections || []).map((c) => {
                const inProgress = c.syncStatus === "in_progress";
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 border rounded" data-testid={`connection-${c.id}`}>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {c.email}
                        {c.syncStatus === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {inProgress && <RefreshCcw className="h-4 w-4 text-blue-600 animate-spin" />}
                        {c.syncStatus === "failed" && <AlertCircle className="h-4 w-4 text-red-600" />}
                        {!c.initialSyncCompleted && <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Initial sync pending</Badge>}
                      </div>
                      {inProgress ? (
                        // Live progress: show what the in-flight run is doing
                        // RIGHT NOW so admins don't see a misleading "last
                        // synced 3h ago" while the sync is actively working.
                        <>
                          <div
                            className="text-sm text-blue-600 dark:text-blue-400 mt-0.5"
                            data-testid={`connection-${c.id}-in-progress`}
                          >
                            {c.firstName} {c.lastName} · Currently syncing —{" "}
                            {(c.currentRunScanned ?? 0).toLocaleString()} scanned ·{" "}
                            {(c.currentRunLogged ?? 0).toLocaleString()} logged
                          </div>
                          <div className="text-xs text-gray-500">
                            Lifetime: {(c.emailsLogged ?? 0).toLocaleString()} logged /{" "}
                            {(c.emailsScanned ?? 0).toLocaleString()} scanned
                            {c.lastSyncedAt && (
                              <> · last completed {formatDistanceToNow(new Date(c.lastSyncedAt))} ago</>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {c.firstName} {c.lastName} ·{" "}
                          {(c.emailsLogged ?? 0).toLocaleString()} logged /{" "}
                          {(c.emailsScanned ?? 0).toLocaleString()} scanned
                          {c.lastSyncedAt && ` · last synced ${formatDistanceToNow(new Date(c.lastSyncedAt))} ago`}
                        </div>
                      )}
                      {c.lastSyncError && !inProgress && (
                        <div className="text-xs text-red-600 mt-1">Error: {c.lastSyncError}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
