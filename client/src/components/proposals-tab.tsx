import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Plus, Search, Eye, Send, MoreHorizontal, FileText,
  CheckCircle, Clock, CreditCard, AlertCircle, ExternalLink,
  Copy
} from "lucide-react";

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  viewed: { label: "Viewed", variant: "outline" },
  signed: { label: "Signed", variant: "default" },
  payment_pending: { label: "Payment Pending", variant: "outline" },
  completed: { label: "Completed", variant: "default" },
  expired: { label: "Expired", variant: "destructive" },
};

export default function ProposalsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  const [paymentAmountType, setPaymentAmountType] = useState("full");
  const [customPaymentAmount, setCustomPaymentAmount] = useState("");
  const [sendEmail, setSendEmail] = useState("");
  const [sendName, setSendName] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: proposalsList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/proposals"],
  });

  const { data: quotesList = [] } = useQuery<any[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: proposalDetail } = useQuery<any>({
    queryKey: ["/api/proposals", selectedProposalId],
    enabled: !!selectedProposalId && isDetailDialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/proposals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      setIsCreateDialogOpen(false);
      setSelectedQuoteId("");
      setPaymentAmountType("full");
      setCustomPaymentAmount("");
      toast({ title: "Proposal created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create proposal", variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("POST", `/api/proposals/${id}/send`, data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      setIsSendDialogOpen(false);
      setSendEmail("");
      setSendName("");
      toast({ title: "Proposal sent", description: `Email sent to ${response.recipientEmail || 'client'}` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send proposal", variant: "destructive" });
    },
  });

  const eligibleQuotes = quotesList.filter((q: any) =>
    ["approved", "accepted", "sent"].includes(q.status) &&
    !proposalsList.some((p: any) => p.quoteId === q.id)
  );

  const filteredProposals = proposalsList.filter((p: any) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = p.quoteName?.toLowerCase().includes(term);
      const matchesClient = p.clientName?.toLowerCase().includes(term);
      const matchesLead = p.leadName?.toLowerCase().includes(term);
      if (!matchesName && !matchesClient && !matchesLead) return false;
    }
    return true;
  });

  const getProposalUrl = (token: string) => {
    return `${window.location.origin}/proposal/${token}`;
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getProposalUrl(token));
    toast({ title: "Link copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="payment_pending">Payment Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#00C9C6] hover:bg-[#00A8A6] text-white"
          disabled={eligibleQuotes.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Proposal
        </Button>
      </div>

      {eligibleQuotes.length === 0 && proposalsList.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Proposals Yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Create proposals from approved quotes to send to clients for signing and payment.
              You need at least one approved, sent, or accepted quote to create a proposal.
            </p>
          </CardContent>
        </Card>
      )}

      {filteredProposals.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Client / Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Signed</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((proposal: any) => {
                  const statusInfo = STATUS_BADGES[proposal.status] || STATUS_BADGES.draft;
                  return (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div className="font-medium">{proposal.quoteName || "Unnamed"}</div>
                        <div className="text-xs text-muted-foreground">
                          {proposal.createdAt ? format(new Date(proposal.createdAt), "MMM d, yyyy") : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{proposal.clientName || proposal.leadName || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className={
                          proposal.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                          proposal.status === "signed" ? "bg-[#00C9C6]/10 text-[#00C9C6]" : ""
                        }>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {proposal.sentAt ? (
                          <div className="text-sm">{format(new Date(proposal.sentAt), "MMM d, yyyy")}</div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {proposal.signedAt ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-sm">{format(new Date(proposal.signedAt), "MMM d")}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Signed by {proposal.signedByName}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {proposal.paidAt ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CreditCard className="h-4 w-4" />
                            <span className="text-sm">${parseFloat(proposal.paidAmount || "0").toLocaleString()}</span>
                          </div>
                        ) : proposal.paymentStatus === "pending" ? (
                          <div className="flex items-center gap-1 text-amber-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Pending</span>
                          </div>
                        ) : proposal.paymentStatus === "failed" ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">Failed</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedProposalId(proposal.id); setIsDetailDialogOpen(true); }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {proposal.status === "draft" && (
                              <DropdownMenuItem onClick={() => { setSelectedProposalId(proposal.id); setIsSendDialogOpen(true); }}>
                                <Send className="h-4 w-4 mr-2" /> Send to Client
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => copyLink(proposal.publicToken)}>
                              <Copy className="h-4 w-4 mr-2" /> Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(getProposalUrl(proposal.publicToken), '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" /> Preview
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Quote</Label>
              <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an approved quote..." />
                </SelectTrigger>
                <SelectContent>
                  {eligibleQuotes.map((q: any) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.name} — ${parseFloat(q.totalCost || "0").toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Amount</Label>
              <Select value={paymentAmountType} onValueChange={setPaymentAmountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Quote Amount</SelectItem>
                  <SelectItem value="custom">Custom Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentAmountType === "custom" && (
              <div>
                <Label>Custom Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={customPaymentAmount}
                  onChange={(e) => setCustomPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            )}
            <Button
              onClick={() => {
                if (!selectedQuoteId) {
                  toast({ title: "Please select a quote", variant: "destructive" });
                  return;
                }
                createMutation.mutate({
                  quoteId: selectedQuoteId,
                  paymentAmountType,
                  customPaymentAmount: paymentAmountType === "custom" ? customPaymentAmount : null,
                });
              }}
              className="w-full bg-[#00C9C6] hover:bg-[#00A8A6] text-white"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Proposal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send the proposal to the client via email. Leave fields blank to use the contact email on file.
            </p>
            <div>
              <Label>Recipient Name (optional)</Label>
              <Input value={sendName} onChange={(e) => setSendName(e.target.value)} placeholder="Client name" />
            </div>
            <div>
              <Label>Recipient Email (optional)</Label>
              <Input value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} placeholder="client@example.com" type="email" />
            </div>
            <Button
              onClick={() => {
                if (!selectedProposalId) return;
                sendMutation.mutate({
                  id: selectedProposalId,
                  data: {
                    recipientName: sendName || undefined,
                    recipientEmail: sendEmail || undefined,
                  },
                });
              }}
              className="w-full bg-[#00C9C6] hover:bg-[#00A8A6] text-white"
              disabled={sendMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendMutation.isPending ? "Sending..." : "Send Proposal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => { setIsDetailDialogOpen(open); if (!open) setSelectedProposalId(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposal Details</DialogTitle>
          </DialogHeader>
          {proposalDetail && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Quote</Label>
                  <div className="font-medium">{proposalDetail.quote?.name || "—"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div>
                    <Badge variant={STATUS_BADGES[proposalDetail.proposal?.status]?.variant || "secondary"}>
                      {STATUS_BADGES[proposalDetail.proposal?.status]?.label || proposalDetail.proposal?.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Client</Label>
                  <div>{proposalDetail.client?.company || proposalDetail.lead?.name || "—"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Total Amount</Label>
                  <div className="font-medium">${parseFloat(proposalDetail.quote?.totalCost || "0").toLocaleString()}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground text-xs mb-2 block">Timeline</Label>
                <div className="space-y-2">
                  {proposalDetail.proposal?.createdAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span>Created: {format(new Date(proposalDetail.proposal.createdAt), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  )}
                  {proposalDetail.proposal?.sentAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Sent: {format(new Date(proposalDetail.proposal.sentAt), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  )}
                  {proposalDetail.proposal?.viewedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>Viewed: {format(new Date(proposalDetail.proposal.viewedAt), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  )}
                  {proposalDetail.proposal?.signedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[#00C9C6]" />
                      <span>Signed by {proposalDetail.proposal.signedByName}: {format(new Date(proposalDetail.proposal.signedAt), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  )}
                  {proposalDetail.proposal?.paidAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Paid ${parseFloat(proposalDetail.proposal.paidAmount || "0").toLocaleString()}: {format(new Date(proposalDetail.proposal.paidAt), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  )}
                </div>
              </div>

              {proposalDetail.items && proposalDetail.items.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground text-xs mb-2 block">Quote Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposalDetail.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.notes || item.itemType}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{item.itemType}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${parseFloat(item.totalCost || "0").toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => copyLink(proposalDetail.proposal?.publicToken)}>
                  <Copy className="h-4 w-4 mr-2" /> Copy Link
                </Button>
                <Button variant="outline" onClick={() => window.open(getProposalUrl(proposalDetail.proposal?.publicToken), '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Preview
                </Button>
                {proposalDetail.proposal?.status === "draft" && (
                  <Button
                    className="bg-[#00C9C6] hover:bg-[#00A8A6] text-white"
                    onClick={() => { setIsDetailDialogOpen(false); setIsSendDialogOpen(true); }}
                  >
                    <Send className="h-4 w-4 mr-2" /> Send to Client
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
