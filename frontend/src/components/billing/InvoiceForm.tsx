import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"

interface MemberOption {
  id: string
  name: string
  unit_id: string | null
}

interface UnitOption {
  id: string
  unit_number: string
  building: string
  maintenance_fee: string
}

const InvoiceForm = () => {
  const navigate = useNavigate()
  const [members, setMembers] = useState<MemberOption[]>([])
  const [units, setUnits] = useState<UnitOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [memberId, setMemberId] = useState("")
  const [unitId, setUnitId] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")

  useEffect(() => {
    Promise.all([api.members.list(), api.units.list()])
      .then(([m, u]) => {
        setMembers(m.filter((member) => member.is_active))
        setUnits(u)
      })
      .catch(() => setError("Failed to load members and units."))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!memberId) return
    const member = members.find((m) => m.id === memberId)
    if (member?.unit_id) {
      setUnitId(member.unit_id)
      const unit = units.find((u) => u.id === member.unit_id)
      if (unit && !amount) setAmount(unit.maintenance_fee)
    }
  }, [memberId, members, units, amount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberId || !unitId) {
      setError("Please select a member with an assigned unit.")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      const result = await api.billing.createInvoice({
        member_id: memberId,
        unit_id: unitId,
        amount: Number(amount),
        due_date: dueDate,
        period_start: periodStart || null,
        period_end: periodEnd || null,
      })
      navigate(`/billing/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/billing")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Create Invoice</h1>
            <p className="text-sm text-slate-500 mt-0.5">Generate a new billing invoice</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label>Member</Label>
                <Select value={memberId} onValueChange={setMemberId} disabled={submitting}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}{member.unit_id ? "" : " (no unit)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={unitId} onValueChange={setUnitId} disabled={submitting || !memberId}>
                  <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unit_number} · {unit.building}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input id="amount" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={submitting} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodStart">Period Start (optional)</Label>
                  <Input id="periodStart" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodEnd">Period End (optional)</Label>
                  <Input id="periodEnd" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} disabled={submitting} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/billing")} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create Invoice"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

export default InvoiceForm
