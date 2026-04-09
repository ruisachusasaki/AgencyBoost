import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, DollarSign, RefreshCw, ExternalLink, FileText, Clock, CheckCircle, XCircle, AlertCircle, Receipt, Loader2, Download } from "lucide-react";
import { format } from "date-fns";

interface BillingData {
  payments: PaymentRecord[];
  stripeInvoices: InvoiceRecord[];
  activeSubscription: SubscriptionInfo | null;
  stripeCustomerId: string | null;
  totalPaid: number;
}

interface PaymentRecord {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  method: string;
  date: string;
  receiptUrl?: string;
  paymentIntentId?: string;
}

interface InvoiceRecord {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  invoiceUrl?: string;
  invoicePdf?: string;
  periodStart?: string;
  periodEnd?: string;
}

interface SubscriptionInfo {
  subscriptionId: string;
  status: string;
  quoteName: string;
  quoteId: string;
  monthlyAmount: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

function statusBadge(status: string) {
  switch (status) {
    case 'paid':
    case 'succeeded':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
    case 'active':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    case 'trialing':
      return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
    case 'processing':
      return <Badge className="bg-blue-100 text-blue-800"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    case 'canceled':
    case 'cancelled':
      return <Badge className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />Canceled</Badge>;
    case 'past_due':
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Past Due</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
}

function methodLabel(method: string) {
  switch (method) {
    case 'card': return 'Credit Card';
    case 'ach': return 'ACH Bank Transfer';
    case 'us_bank_account': return 'ACH Bank Transfer';
    default: return method.charAt(0).toUpperCase() + method.slice(1);
  }
}

export default function ClientBillingTab({ clientId }: { clientId: string }) {
  const { data: billing, isLoading, refetch, isRefetching } = useQuery<BillingData>({
    queryKey: ["/api/clients", clientId, "billing"],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/billing`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch billing");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="text-center py-12">
        <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No Billing Data</h3>
        <p className="text-gray-500">No payment or billing information found for this client.</p>
      </div>
    );
  }

  const hasSubscription = billing.activeSubscription !== null;
  const hasPayments = billing.payments.length > 0;
  const hasInvoices = billing.stripeInvoices.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Billing & Payments</h2>
          <p className="text-sm text-gray-500 mt-1">Payment history, subscription status, and invoices</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">${billing.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Recurring Billing</p>
                {hasSubscription ? (
                  <div>
                    <p className="text-2xl font-bold text-gray-900">${billing.activeSubscription!.monthlyAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo</p>
                    <div className="mt-1">{statusBadge(billing.activeSubscription!.status)}</div>
                  </div>
                ) : (
                  <p className="text-lg font-medium text-gray-400">None</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Receipt className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{billing.payments.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">{billing.stripeInvoices.length} invoice(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasSubscription && billing.activeSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Active Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Proposal</p>
                <p className="text-sm font-medium">{billing.activeSubscription.quoteName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Monthly Amount</p>
                <p className="text-sm font-medium">${billing.activeSubscription.monthlyAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <div className="mt-0.5">{statusBadge(billing.activeSubscription.status)}</div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Current Period</p>
                <p className="text-sm font-medium">
                  {billing.activeSubscription.currentPeriodStart && billing.activeSubscription.currentPeriodEnd
                    ? `${format(new Date(billing.activeSubscription.currentPeriodStart), 'MMM d')} - ${format(new Date(billing.activeSubscription.currentPeriodEnd), 'MMM d, yyyy')}`
                    : 'N/A'}
                </p>
              </div>
            </div>
            {billing.activeSubscription.cancelAtPeriodEnd && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                This subscription is set to cancel at the end of the current period.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasPayments ? (
            <div className="text-center py-8">
              <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No payments recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {payment.date ? format(new Date(payment.date), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{payment.description}</TableCell>
                    <TableCell className="text-sm text-gray-600">{methodLabel(payment.method)}</TableCell>
                    <TableCell>{statusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {payment.receiptUrl && (
                        <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {hasInvoices && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Subscription Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.stripeInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-sm">
                      {inv.date ? format(new Date(inv.date), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{inv.description}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {inv.periodStart && inv.periodEnd
                        ? `${format(new Date(inv.periodStart), 'MMM d')} - ${format(new Date(inv.periodEnd), 'MMM d')}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{statusBadge(inv.status || 'unknown')}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {inv.invoiceUrl && (
                          <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="View Invoice">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                        {inv.invoicePdf && (
                          <a href={inv.invoicePdf} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Download PDF">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
