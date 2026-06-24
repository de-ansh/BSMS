import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  CreditCard, Plus, Eye, Search, Download, Receipt,
  CheckCircle2, Clock, AlertTriangle, ArrowUpDown, Filter, X, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

interface Invoice {
  id: string
  invoice_number: string
  member_id: string
  amount: string
  due_date: string
  status: string
  created_at: string
}

interface Member {
  id: string
  name: string
  email: string
  phone: string
  unit_id: string | null
  is_active: boolean
  created_at: string
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
    case "overdue":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "paid":
      return <CheckCircle2 className="h-3.5 w-3.5" />
    case "pending":
      return <Clock className="h-3.5 w-3.5" />
    case "overdue":
      return <AlertTriangle className="h-3.5 w-3.5" />
    default:
      return null
  }
}

const formatCurrency = (amount: string | number) => {
  return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

const BillingPayments = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const memberFilter = searchParams.get("member_id") || ""
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Auto-Bill Modal State
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false)
  const [autoBillForm, setAutoBillForm] = useState({
    due_date: "",
    period_start: "",
    period_end: "",
  })
  const [autoBillLoading, setAutoBillLoading] = useState(false)
  const [autoBillError, setAutoBillError] = useState("")
  const [autoBillSuccess, setAutoBillSuccess] = useState<any>(null)

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [cardForm, setCardForm] = useState({
    card_number: "",
    expiry: "",
    cvv: "",
    name: "",
  })
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState("")
  const [paySuccess, setPaySuccess] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([api.billing.invoices(), api.members.list(), api.auth.me()])
      .then(([inv, mem, profile]) => {
        setInvoices(inv)
        setMembers(mem)
        setUser(profile)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const memberMap = new Map<string, Member>()
  members.forEach(m => memberMap.set(m.id, m))

  const getMemberName = (memberId: string) => {
    return memberMap.get(memberId)?.name || "Unknown"
  }

  const getMemberInitials = (memberId: string) => {
    const name = memberMap.get(memberId)?.name
    if (!name) return "?"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const paidInvoices = invoices.filter(i => i.status === "paid")
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const overdueInvoices = invoices.filter(i => i.status === "overdue")
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const pendingInvoices = invoices.filter(i => i.status === "pending")
  const unpaidAmount = totalAmount - paidAmount

  const filteredInvoices = invoices.filter(inv => {
    if (memberFilter && inv.member_id !== memberFilter) return false
    if (statusFilter !== "all" && inv.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const memberName = getMemberName(inv.member_id).toLowerCase()
      if (!inv.invoice_number.toLowerCase().includes(q) && !memberName.includes(q)) return false
    }
    return true
  })

  const handleExport = () => {
    const headers = ["Invoice Number", "Member", "Amount", "Due Date", "Status", "Created"]
    const rows = filteredInvoices.map((inv) => [
      inv.invoice_number,
      getMemberName(inv.member_id),
      inv.amount,
      inv.due_date,
      inv.status,
      inv.created_at,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAutoBillLoading(true)
    setAutoBillError("")
    setAutoBillSuccess(null)
    try {
      const res = await api.billing.autoGenerate({
        due_date: autoBillForm.due_date,
        period_start: autoBillForm.period_start || undefined,
        period_end: autoBillForm.period_end || undefined,
      })
      setAutoBillSuccess(res)
      // Refresh invoices
      const updatedInvoices = await api.billing.invoices()
      setInvoices(updatedInvoices)
      setAutoBillForm({ due_date: "", period_start: "", period_end: "" })
    } catch (err) {
      setAutoBillError(err instanceof Error ? err.message : "Failed to auto-generate invoices")
    } finally {
      setAutoBillLoading(false)
    }
  }

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice) return
    setPayLoading(true)
    setPayError("")
    try {
      await api.billing.pay(selectedInvoice.id, {
        card_number: cardForm.card_number,
        expiry: cardForm.expiry,
        cvv: cardForm.cvv,
      })
      setPaySuccess(true)
      // Refresh invoices
      const updatedInvoices = await api.billing.invoices()
      setInvoices(updatedInvoices)
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Payment processing failed")
    } finally {
      setPayLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-20 bg-slate-200 dark:bg-slate-800 rounded" /></CardContent></Card>
          ))}
        </div>
        <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    )
  }

  const isAdmin = user?.role === "admin"

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Billing & Payments</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
            {memberFilter ? ` for ${getMemberName(memberFilter)}` : ""}
          </p>
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" className="gap-2 font-semibold" onClick={handleExport} disabled={filteredInvoices.length === 0}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button variant="outline" className="gap-2 font-semibold border-violet-500/30 text-violet-600 hover:bg-violet-500/10" onClick={() => {
              setAutoBillSuccess(null)
              setAutoBillError("")
              setShowAutoGenerateModal(true)
            }}>
              <Receipt className="h-4 w-4" /> Auto-Bill
            </Button>
            <Button className="gap-2 font-semibold" onClick={() => navigate("/billing/new")}>
              <Plus className="h-4 w-4" /> Create Invoice
            </Button>
          </div>
        ) : null}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <span className="text-slate-500 text-xs md:text-sm font-medium uppercase tracking-wider">
                {isAdmin ? "Total Billed" : "My Total Balance"}
              </span>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold font-mono">{formatCurrency(totalAmount.toFixed(2))}</p>
            <p className="text-xs text-slate-400 mt-1">{invoices.length} invoices</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <span className="text-slate-500 text-xs md:text-sm font-medium uppercase tracking-wider">
                {isAdmin ? "Collected" : "Total Paid"}
              </span>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold font-mono">{formatCurrency(paidAmount.toFixed(2))}</p>
            <p className="text-xs text-slate-400 mt-1">{paidInvoices.length} paid invoices</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <span className="text-slate-500 text-xs md:text-sm font-medium uppercase tracking-wider">
                {isAdmin ? "Pending Count" : "Total Unpaid"}
              </span>
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold font-mono">
              {isAdmin ? pendingInvoices.length : formatCurrency(unpaidAmount.toFixed(2))}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isAdmin ? "awaiting payment" : `${pendingInvoices.length} outstanding`}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <span className="text-slate-500 text-xs md:text-sm font-medium uppercase tracking-wider">Overdue</span>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold font-mono">{formatCurrency(overdueAmount.toFixed(2))}</p>
            <p className="text-xs text-slate-400 mt-1">{overdueInvoices.length} overdue invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              placeholder="Search invoice or member..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-end gap-2 self-end pb-0.5">
          <Button variant="outline" className="gap-2 font-semibold hidden sm:flex">
            <Filter className="h-4 w-4" /> More Filters
          </Button>
          <Button variant="outline" className="gap-2 font-semibold hidden sm:flex">
            <ArrowUpDown className="h-4 w-4" /> Sort
          </Button>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Receipt className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
            <p className="text-lg font-semibold mb-1">No invoices found</p>
            <p className="text-sm">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first invoice to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && isAdmin && (
              <Button className="mt-4 gap-2" onClick={() => navigate("/billing/new")}>
                <Plus className="h-4 w-4" /> Create Invoice
              </Button>
            )}
          </div>
        ) : (
          filteredInvoices.map(inv => {
            const memberName = getMemberName(inv.member_id)
            return (
              <Card
                key={inv.id}
                className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/billing/${inv.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getMemberInitials(inv.member_id)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{memberName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{inv.invoice_number}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`${getStatusStyle(inv.status)} gap-1 border-none font-semibold text-[10px] py-0.5 px-2.5 uppercase tracking-wide`}>
                      {getStatusIcon(inv.status)}
                      {inv.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-white/5">
                    <span className="text-slate-500">{formatDate(inv.due_date)}</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(inv.amount)}</span>
                  </div>
                  {!isAdmin && (inv.status === "pending" || inv.status === "overdue") && (
                    <Button
                      className="w-full mt-3 bg-primary text-black hover:bg-primary/95 font-bold uppercase tracking-widest text-xs h-9"
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedInvoice(inv)
                        setCardForm({ card_number: "", expiry: "", cvv: "", name: "" })
                        setPayError("")
                        setPaySuccess(false)
                        setShowPayModal(true)
                      }}
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 border rounded-xl overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Receipt className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
            <p className="text-lg font-semibold mb-1">No invoices found</p>
            <p className="text-sm">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first invoice to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && isAdmin && (
              <Button className="mt-4 gap-2" onClick={() => navigate("/billing/new")}>
                <Plus className="h-4 w-4" /> Create Invoice
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Member</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Invoice</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Amount</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Due Date</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Status</TableHead>
                <TableHead className="w-[140px] text-right font-bold text-xs uppercase text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map(inv => (
                <TableRow
                  key={inv.id}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                  onClick={() => navigate(`/billing/${inv.id}`)}
                >
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getMemberInitials(inv.member_id)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{getMemberName(inv.member_id)}</p>
                        <p className="text-[10px] text-slate-400">{memberMap.get(inv.member_id)?.email || ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                    {inv.invoice_number}
                  </TableCell>
                  <TableCell className="font-bold font-mono text-sm text-slate-900 dark:text-white">
                    {formatCurrency(inv.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 font-medium">
                    {formatDate(inv.due_date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${getStatusStyle(inv.status)} gap-1 border-none font-semibold text-[10px] py-0.5 px-2.5 uppercase tracking-wide`}>
                      {getStatusIcon(inv.status)}
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {!isAdmin && (inv.status === "pending" || inv.status === "overdue") && (
                        <Button
                          size="sm"
                          className="bg-primary text-black hover:bg-primary/90 font-semibold text-xs py-1 px-3 h-8 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                          onClick={() => {
                            setSelectedInvoice(inv)
                            setCardForm({ card_number: "", expiry: "", cvv: "", name: "" })
                            setPayError("")
                            setPaySuccess(false)
                            setShowPayModal(true)
                          }}
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay Now
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary"
                        onClick={() => navigate(`/billing/${inv.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ================= MODAL: AUTO GENERATE ================= */}
      {showAutoGenerateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 space-y-4 border border-white/10 rounded-xl bg-slate-900 text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-white text-lg uppercase tracking-wide">Auto-Generate Invoices</h3>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-0.5">BULK LEDGER BILLING</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setShowAutoGenerateModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {autoBillError && (
              <div className="p-3 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-xs">{autoBillError}</div>
            )}

            {autoBillSuccess && (
              <div className="p-4 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-sm space-y-1">
                <p className="font-bold">Generation Complete!</p>
                <p className="text-xs font-light">Successfully created {autoBillSuccess.generated_count} monthly maintenance invoices.</p>
                <p className="text-xs font-mono">Total value: {formatCurrency(autoBillSuccess.total_amount)}</p>
              </div>
            )}

            {!autoBillSuccess && (
              <form onSubmit={handleAutoGenerate} className="space-y-4 text-slate-200">
                <p className="text-xs text-slate-400 leading-relaxed font-light font-sans">
                  This tool will automatically create a monthly maintenance invoice for all active, occupied units in your building using their registered maintenance fee.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-slate-300">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    required
                    value={autoBillForm.due_date}
                    onChange={e => setAutoBillForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="bg-black/20 border-white/10 text-white focus-visible:ring-primary [color-scheme:dark]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodStart" className="text-slate-300">Period Start</Label>
                    <Input
                      id="periodStart"
                      type="date"
                      value={autoBillForm.period_start}
                      onChange={e => setAutoBillForm(prev => ({ ...prev, period_start: e.target.value }))}
                      className="bg-black/20 border-white/10 text-white focus-visible:ring-primary [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodEnd" className="text-slate-300">Period End</Label>
                    <Input
                      id="periodEnd"
                      type="date"
                      value={autoBillForm.period_end}
                      onChange={e => setAutoBillForm(prev => ({ ...prev, period_end: e.target.value }))}
                      className="bg-black/20 border-white/10 text-white focus-visible:ring-primary [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <Button type="button" variant="outline" className="flex-1 glass text-slate-300" onClick={() => setShowAutoGenerateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={autoBillLoading} className="flex-1 font-bold tracking-wider uppercase bg-primary text-black hover:bg-primary/95 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    {autoBillLoading ? "Generating..." : "Generate Bills"}
                  </Button>
                </div>
              </form>
            )}

            {autoBillSuccess && (
              <div className="flex justify-end pt-2 border-t border-white/10">
                <Button className="w-full font-bold uppercase tracking-wider" onClick={() => setShowAutoGenerateModal(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: SIMULATED PAYMENT ================= */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 space-y-4 border border-white/10 rounded-xl bg-slate-900 text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-white text-lg uppercase tracking-wide">Secure Checkout</h3>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-0.5">ONLINE CHECKOUT SIMULATION</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setShowPayModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {payError && (
              <div className="p-3 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-xs">{payError}</div>
            )}

            {paySuccess ? (
              <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-emerald-400 uppercase tracking-wider">Payment Approved</h4>
                  <p className="text-xs text-slate-400 mt-1 font-light">Your transaction completed successfully.</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5 font-mono text-xs w-full text-left space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Invoice:</span> <span className="text-slate-300 font-bold">{selectedInvoice.invoice_number}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Amount Paid:</span> <span className="text-emerald-400 font-bold">{formatCurrency(selectedInvoice.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Method:</span> <span className="text-slate-300">Credit Card (Simulated)</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Ref Code:</span> <span className="text-primary font-bold">SIM-PAY-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span></div>
                </div>
                <Button className="w-full font-bold uppercase tracking-wider" onClick={() => setShowPayModal(false)}>
                  Back to Ledger
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePayInvoice} className="space-y-4">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Total Due</span>
                    <span className="font-mono font-bold text-lg text-primary">{selectedInvoice.invoice_number}</span>
                  </div>
                  <span className="font-mono font-bold text-2xl text-emerald-400">{formatCurrency(selectedInvoice.amount)}</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardHolder" className="text-slate-300 font-semibold text-xs">Cardholder Name</Label>
                  <Input
                    id="cardHolder"
                    placeholder="e.g. John Doe"
                    required
                    value={cardForm.name}
                    onChange={e => setCardForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-700 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-slate-300 font-semibold text-xs">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="•••• •••• •••• ••••"
                    required
                    maxLength={16}
                    value={cardForm.card_number}
                    onChange={e => setCardForm(prev => ({ ...prev, card_number: e.target.value.replace(/\D/g, "") }))}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-700 focus-visible:ring-primary font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-slate-300 font-semibold text-xs">Expiration Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      required
                      maxLength={5}
                      value={cardForm.expiry}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, "")
                        if (val.length > 2) val = val.substring(0, 2) + "/" + val.substring(2, 4)
                        setCardForm(prev => ({ ...prev, expiry: val }))
                      }}
                      className="bg-black/20 border-white/10 text-white placeholder:text-slate-700 focus-visible:ring-primary font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-slate-300 font-semibold text-xs">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="•••"
                      type="password"
                      required
                      maxLength={3}
                      value={cardForm.cvv}
                      onChange={e => setCardForm(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, "") }))}
                      className="bg-black/20 border-white/10 text-white placeholder:text-slate-700 focus-visible:ring-primary font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <Button type="button" variant="outline" className="flex-1 glass text-slate-300 font-semibold" onClick={() => setShowPayModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={payLoading} className="flex-1 font-bold tracking-wider uppercase bg-primary text-black hover:bg-primary/95 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    {payLoading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                    {payLoading ? "Processing..." : "Complete Payment"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingPayments
