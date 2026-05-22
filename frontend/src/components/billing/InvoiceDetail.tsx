import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Printer, CreditCard, CalendarDays, Building2, User as UserIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"

const formatCurrency = (amount: string | number) => {
  return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "paid": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "pending": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
    case "overdue": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
  }
}

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError("")
    api.billing.getInvoice(id)
      .then(setInvoice)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load invoice"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <p className="text-lg font-semibold mb-2 text-red-500">Error loading invoice</p>
          <p className="text-sm mb-4">{error}</p>
          <Button variant="outline" onClick={() => navigate("/billing")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Ledger
          </Button>
        </div>
      </div>
    )
  }

  if (!invoice) return null

  const member = invoice.member as { name?: string; email?: string; unit_number?: string } | undefined
  const memberName = (invoice.member_name as string) || member?.name || "Unknown"
  const memberEmail = (invoice.member_email as string) || member?.email || ""
  const memberUnit = (invoice.unit_number as string) || member?.unit_number || "-"
  const invoiceNumber = (invoice.invoice_number as string) || `INV-${id?.slice(0, 8)}`
  const amount = (invoice.amount as string) || "0"
  const dueDate = invoice.due_date as string
  const status = (invoice.status as string) || "pending"
  const createdAt = invoice.created_at as string
  const charges = (invoice.charges as Array<Record<string, unknown>>) || []
  const payments = (invoice.payment_history as Array<Record<string, unknown>>) || (invoice.payments as Array<Record<string, unknown>>) || []
  const memberId = (invoice.member_id as string) || ""

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/billing")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{invoiceNumber}</h1>
            <p className="text-sm text-slate-500">Created {formatDate(createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 font-semibold" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" className="gap-2 font-semibold" onClick={() => navigate("/billing")}>
            <ArrowLeft className="h-4 w-4" /> Back to Ledger
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Amount</p>
                  <p className="text-2xl font-bold font-mono">{formatCurrency(amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</p>
                  <Badge variant="secondary" className={`${getStatusStyle(status)} border-none font-semibold text-[10px] uppercase`}>
                    {status}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Due Date</p>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {formatDate(dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Invoice ID</p>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400">{id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {charges.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Charges</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase text-slate-500">Description</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charges.map((charge, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{(charge.description as string) || "Charge"}</TableCell>
                        <TableCell className="font-mono text-sm text-right">{formatCurrency((charge.amount as string) || "0")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {payments.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Payment History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase text-slate-500">Date</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-slate-500">Method</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((pmt, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{formatDate(pmt.payment_date as string)}</TableCell>
                        <TableCell className="text-sm capitalize">{(pmt.payment_method as string) || "-"}</TableCell>
                        <TableCell className="font-mono text-sm text-right">{formatCurrency((pmt.amount as string) || "0")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Member Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{memberName}</p>
                  <p className="text-xs text-slate-500">{memberEmail}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Unit:</span>
                  <span className="font-semibold">{memberUnit}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Member ID:</span>
                  <span className="font-mono text-xs">{memberId.slice(0, 12)}...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetail
