/**
 * Emails tab on the client profile.
 *
 * Lists logged emails (sourced from gmail-sync) for a single client, grouped
 * by Gmail threadId so a back-and-forth conversation reads as one expandable
 * card. Supports filtering by direction, free-text search and reveals
 * attachment chips that link to the on-demand `/api/emails/:id/attachments/:id`
 * endpoint.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Mail,
  ArrowDownLeft,
  ArrowUpRight,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";

interface AttachmentMeta {
  id: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
}

interface LoggedEmail {
  id: string;
  gmailMessageId: string;
  gmailThreadId: string;
  fromEmail: string;
  fromName: string | null;
  toEmails: string[];
  ccEmails: string[];
  subject: string | null;
  snippet: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  direction: "inbound" | "outbound";
  hasAttachments: boolean;
  matchedDomain: string | null;
  matchedEmail: string | null;
  receivedAt: string;
  attachments: AttachmentMeta[];
}

interface Props {
  clientId: string;
}

export function ClientEmailsTab({ clientId }: Props) {
  const [direction, setDirection] = useState<"all" | "inbound" | "outbound">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Debounce search input
  useMemo(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery<{ emails: LoggedEmail[] }>({
    queryKey: ["/api/clients", clientId, "emails", { direction, search: debouncedSearch }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "200");
      if (direction !== "all") params.set("direction", direction);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/clients/${clientId}/emails?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to load emails: ${res.statusText}`);
      return res.json();
    },
  });

  const threads = useMemo(() => {
    const byThread = new Map<string, LoggedEmail[]>();
    for (const e of data?.emails || []) {
      const arr = byThread.get(e.gmailThreadId) || [];
      arr.push(e);
      byThread.set(e.gmailThreadId, arr);
    }
    // Sort thread members oldest -> newest, and threads by their newest message desc.
    const result = Array.from(byThread.entries()).map(([threadId, msgs]) => {
      const sorted = [...msgs].sort((a, b) => +new Date(a.receivedAt) - +new Date(b.receivedAt));
      return { threadId, messages: sorted, latest: sorted[sorted.length - 1] };
    });
    result.sort((a, b) => +new Date(b.latest.receivedAt) - +new Date(a.latest.receivedAt));
    return result;
  }, [data]);

  const toggleThread = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search subject, snippet, or sender…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-email-search"
          />
        </div>
        <Select value={direction} onValueChange={(v) => setDirection(v as any)}>
          <SelectTrigger className="md:w-44" data-testid="select-email-direction">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All directions</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-center text-gray-500">Loading…</CardContent></Card>
      ) : threads.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-gray-500">
            <Mail className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No emails logged yet</p>
            <p className="text-sm mt-1">
              Once a staff member connects their Gmail and a message matches this client, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map(({ threadId, messages, latest }) => {
            const isOpen = expanded.has(threadId);
            const counts = {
              in: messages.filter(m => m.direction === "inbound").length,
              out: messages.filter(m => m.direction === "outbound").length,
            };
            return (
              <Card key={threadId} data-testid={`thread-${threadId}`}>
                <CardContent className="p-0">
                  <button
                    type="button"
                    onClick={() => toggleThread(threadId)}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4 mt-1 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 mt-1 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {latest.subject || "(no subject)"}
                        </span>
                        {messages.length > 1 && <Badge variant="secondary">{messages.length}</Badge>}
                        {counts.in > 0 && <Badge variant="outline" className="gap-1"><ArrowDownLeft className="h-3 w-3" />{counts.in}</Badge>}
                        {counts.out > 0 && <Badge variant="outline" className="gap-1"><ArrowUpRight className="h-3 w-3" />{counts.out}</Badge>}
                        {messages.some(m => m.hasAttachments) && (
                          <Badge variant="outline" className="gap-1"><Paperclip className="h-3 w-3" /></Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {latest.fromName || latest.fromEmail} · {format(new Date(latest.receivedAt), "PPp")}
                      </p>
                      {latest.snippet && !isOpen && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">{latest.snippet}</p>
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t divide-y">
                      {messages.map((m) => {
                        const open = selectedMessageId === m.id;
                        return (
                          <div key={m.id} className="p-4" data-testid={`email-${m.id}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {m.direction === "inbound" ? (
                                    <Badge variant="secondary" className="gap-1"><ArrowDownLeft className="h-3 w-3" /> Inbound</Badge>
                                  ) : (
                                    <Badge className="gap-1"><ArrowUpRight className="h-3 w-3" /> Outbound</Badge>
                                  )}
                                  <span className="font-medium text-sm">
                                    {m.fromName ? `${m.fromName} <${m.fromEmail}>` : m.fromEmail}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  To: {m.toEmails.join(", ") || "—"}
                                  {m.ccEmails.length > 0 && <> · Cc: {m.ccEmails.join(", ")}</>}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(m.receivedAt), "PPpp")}
                                  {m.matchedDomain && (
                                    <> · matched <span className="font-mono">{m.matchedEmail || m.matchedDomain}</span></>
                                  )}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedMessageId(open ? null : m.id)}
                                data-testid={`button-toggle-body-${m.id}`}
                              >
                                {open ? "Hide" : "Show"} body
                              </Button>
                            </div>

                            {open && (
                              <div className="mt-3 prose prose-sm max-w-none dark:prose-invert">
                                {m.bodyHtml ? (
                                  <div
                                    className="border rounded p-3 bg-gray-50 dark:bg-gray-900/40"
                                    // Sanitize on the client even though Gmail returns "safe" HTML —
                                    // belt-and-suspenders so a future code change or transport-layer
                                    // tampering can't introduce a stored-XSS vector via this surface.
                                    dangerouslySetInnerHTML={{
                                      __html: DOMPurify.sanitize(m.bodyHtml, {
                                        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
                                        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
                                      }),
                                    }}
                                  />
                                ) : m.bodyText ? (
                                  <pre className="whitespace-pre-wrap text-sm border rounded p-3 bg-gray-50 dark:bg-gray-900/40 font-sans">
                                    {m.bodyText}
                                  </pre>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">{m.snippet || "(no body stored)"}</p>
                                )}
                              </div>
                            )}

                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {m.attachments.map((a) => (
                                  <a
                                    key={a.id}
                                    href={`/api/emails/${m.id}/attachments/${a.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                    data-testid={`attachment-${a.id}`}
                                  >
                                    <Paperclip className="h-3 w-3" />
                                    <span className="truncate max-w-[200px]">{a.filename}</span>
                                    {typeof a.sizeBytes === "number" && (
                                      <span className="text-gray-500">({formatBytes(a.sizeBytes)})</span>
                                    )}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
