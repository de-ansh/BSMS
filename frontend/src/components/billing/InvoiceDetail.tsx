import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Printer, CreditCard, CalendarDays, Building2, User as UserIcon, Loader2, X, CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api"

const RESERVED_IDS = new Set(["new", "export", "edit"])

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
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [recording, setRecording] = useState(false)
  const [paymentError, setPaymentError] = useState("")

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false)
  const [cardForm, setCardForm] = useState({
    card_number: "",
    expiry: "",
    cvv: "",
    name: "",
  })
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState("")
  const [paySuccess, setPaySuccess] = useState(false)

  const loadInvoice = () => {
    if (!id || RESERVED_IDS.has(id)) return
    setLoading(true)
    setError("")
    api.billing.getInvoice(id)
      .then(setInvoice)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load invoice"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!id || RESERVED_IDS.has(id)) {
      if (id && RESERVED_IDS.has(id)) navigate("/billing", { replace: true })
      return
    }
    loadInvoice()
    api.auth.me().then(setUser).catch(() => {})
  }, [id, navigate])

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setPaymentError("")
    setRecording(true)
    try {
      await api.billing.createPayment({
        invoice_id: id,
        amount: Number(paymentAmount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
      })
      setPaymentAmount("")
      loadInvoice()
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Failed to record payment")
    } finally {
      setRecording(false)
    }
  }

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setPayLoading(true)
    setPayError("")
    try {
      await api.billing.pay(id, {
        card_number: cardForm.card_number,
        expiry: cardForm.expiry,
        cvv: cardForm.cvv,
      })
      setPaySuccess(true)
      loadInvoice()
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Payment processing failed")
    } finally {
      setPayLoading(false)
    }
  }

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
  const paidTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const remaining = Math.max(Number(amount) - paidTotal, 0)
  const canRecordPayment = status !== "paid" && remaining > 0

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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Amount</p>
                  <p className="text-2xl font-bold font-mono">{formatCurrency(amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Paid</p>
                  <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(paidTotal)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Remaining</p>
                  <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{formatCurrency(remaining)}</p>
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

          {user?.role === "admin" && canRecordPayment && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Record Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  {paymentError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{paymentError}</div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payAmount">Amount ($)</Label>
                      <Input id="payAmount" type="number" min="0.01" step="0.01" max={remaining} required value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} disabled={recording} placeholder={remaining.toFixed(2)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payDate">Date</Label>
                      <Input id="payDate" type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} disabled={recording} />
                    </div>
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={recording}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="gap-2" disabled={recording}>
                    {recording ? <><Loader2 className="h-4 w-4 animate-spin" /> Recording...</> : <><CreditCard className="h-4 w-4" /> Record Payment</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {user?.role === "resident" && canRecordPayment && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Online Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500 font-light leading-relaxed">
                  You can pay the remaining outstanding balance of <span className="font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(remaining)}</span> online via our simulated credit card checkout.
                </p>
                <Button
                  className="w-full bg-primary text-black hover:bg-primary/95 font-bold uppercase tracking-widest text-xs h-10 gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                  onClick={() => {
                    setCardForm({ card_number: "", expiry: "", cvv: "", name: "" })
                    setPayError("")
                    setPaySuccess(false)
                    setShowPayModal(true)
                  }}
                >
                  <CreditCard className="h-4 w-4" /> Pay Outstanding Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ================= MODAL: SIMULATED PAYMENT ================= */}
      {showPayModal && (
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
                  <div className="flex justify-between"><span className="text-slate-500">Invoice:</span> <span className="text-slate-300 font-bold">{invoiceNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Amount Paid:</span> <span className="text-emerald-400 font-bold">{formatCurrency(remaining)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Method:</span> <span className="text-slate-300">Credit Card (Simulated)</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Ref Code:</span> <span className="text-primary font-bold">SIM-PAY-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span></div>
                </div>
                <Button className="w-full font-bold uppercase tracking-wider" onClick={() => setShowPayModal(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePayInvoice} className="space-y-4">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Total Due</span>
                    <span className="font-mono font-bold text-lg text-primary">{invoiceNumber}</span>
                  </div>
                  <span className="font-mono font-bold text-2xl text-emerald-400">{formatCurrency(remaining)}</span>
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
                  <Button type="submit" disabled={payLoading} className="flex-1 font-bold tracking-wider uppercase bg-primary text-black hover:bg-primary/95 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
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

export default InvoiceDetail
