import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, ExternalLink, Search } from "lucide-react";
import { format } from "date-fns";

type PortalAsset = {
  id: string;
  name: string;
  linkUrl: string | null;
  updatedAt: string;
  createdAt: string;
  type: { id: string; name: string } | null;
  status: { id: string; name: string; color: string } | null;
};

interface Props {
  primaryColor: string;
}

export function ClientPortalAssetsSection({ primaryColor }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: assets = [], isLoading } = useQuery<PortalAsset[]>({
    queryKey: ["/api/client-portal/assets"],
  });

  const types = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assets) {
      if (a.type) map.set(a.type.id, a.type.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [assets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && a.type?.id !== typeFilter) return false;
      return true;
    });
  }, [assets, search, typeFilter]);

  return (
    <Card data-testid="card-portal-assets">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" style={{ color: primaryColor }} />
          <CardTitle className="text-lg">Your Assets</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                style={{ borderColor: primaryColor, borderTopColor: "transparent" }}
              />
              <p className="text-muted-foreground">Loading your assets...</p>
            </div>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" data-testid="empty-portal-assets">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No assets have been shared with you yet.</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-portal-assets-search"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-portal-assets-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No assets match your filters.</p>
              </div>
            ) : (
              <>
                {/* Desktop / tablet: table */}
                <div className="hidden md:block overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left font-medium px-4 py-2.5">Name</th>
                        <th className="text-left font-medium px-4 py-2.5">Type</th>
                        <th className="text-left font-medium px-4 py-2.5">Status</th>
                        <th className="text-left font-medium px-4 py-2.5">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((a) => (
                        <tr key={a.id} className="border-t hover:bg-muted/30 transition-colors" data-testid={`row-portal-asset-${a.id}`}>
                          <td className="px-4 py-3">
                            {a.linkUrl ? (
                              <a
                                href={a.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-medium hover:underline"
                                style={{ color: primaryColor }}
                                data-testid={`link-portal-asset-${a.id}`}
                              >
                                {a.name}
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <span className="font-medium">{a.name}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{a.type?.name ?? "—"}</td>
                          <td className="px-4 py-3">
                            {a.status ? (
                              <Badge
                                variant="outline"
                                className="font-medium"
                                style={{
                                  backgroundColor: `${a.status.color}1A`,
                                  borderColor: a.status.color,
                                  color: a.status.color,
                                }}
                              >
                                {a.status.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {format(new Date(a.updatedAt), "MMM d, yyyy")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: card list */}
                <div className="md:hidden space-y-3">
                  {filtered.map((a) => (
                    <div
                      key={a.id}
                      className="border rounded-md p-3 space-y-2"
                      data-testid={`card-portal-asset-${a.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {a.linkUrl ? (
                          <a
                            href={a.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium hover:underline"
                            style={{ color: primaryColor }}
                          >
                            {a.name}
                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="font-medium">{a.name}</span>
                        )}
                        {a.status && (
                          <Badge
                            variant="outline"
                            className="font-medium flex-shrink-0"
                            style={{
                              backgroundColor: `${a.status.color}1A`,
                              borderColor: a.status.color,
                              color: a.status.color,
                            }}
                          >
                            {a.status.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{a.type?.name ?? "—"}</span>
                        <span>Updated {format(new Date(a.updatedAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
