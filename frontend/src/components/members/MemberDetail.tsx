import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Mail, Phone, CalendarDays, CreditCard, Send, Edit3,
  Building2, ChevronLeft, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"
import type { PaymentRecord } from "@/lib/api"

interface MemberDetailData {
  id: string
  name: string
  email: string
  phone: string
  unit_id: string | null
  move_in_date: string | null
  is_owner: boolean
  is_active: boolean
  created_at: string
  unit_number: string | null
  building: string | null
  maintenance_fee: string | null
  outstanding_balance: string
  payment_history: PaymentRecord[]
}

const MemberDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [member, setMember] = useState<MemberDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.members
      .get(id)
      .then((data) => {
        setMember(data as unknown as MemberDetailData)
      })
      .catch(() => navigate("/members"))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-32" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center py-20 text-slate-400">
        <Building2 className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
        <p className="text-lg font-semibold mb-1">Member not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/members")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Members
        </Button>
      </div>
    )
  }

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const balance = Number(member.outstanding_balance)
  const hasBalance = balance > 0

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
              Member Profile
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 font-semibold text-xs sm:text-sm" onClick={() => navigate("/members")}>
              <Edit3 className="h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" className="gap-2 font-semibold text-xs sm:text-sm" onClick={() => navigate("/notices")}>
              <Send className="h-4 w-4" /> Send Notice
            </Button>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-slate-50 dark:border-slate-800 shadow-xl shrink-0">
                <AvatarFallback className="text-2xl md:text-3xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{member.name}</h1>
                  <Badge
                    variant="secondary"
                    className={`border-none font-semibold text-xs ${
                      member.is_owner
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}
                  >
                    {member.is_owner ? "Owner" : "Tenant"}
                  </Badge>
                </div>
                <p className="text-base text-slate-500 font-medium">
                  Unit {member.unit_number || "—"} {member.building ? `· ${member.building}` : ""}
                </p>
                {member.move_in_date && (
                  <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Move-in: {new Date(member.move_in_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Contact</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Email</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Phone</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{member.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Unit Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Unit Number</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{member.unit_number || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Building</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{member.building || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Maintenance Fee</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {member.maintenance_fee ? `$${member.maintenance_fee}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Status</p>
                  <Badge
                    variant="secondary"
                    className={`border-none font-semibold text-[10px] ${
                      member.is_active
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {hasBalance && (
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Outstanding Balance</h3>
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30">
                <p className="text-[10px] font-bold uppercase text-rose-500 mb-1">Amount Due</p>
                <p className="text-3xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  ${balance.toLocaleString()}
                </p>
              </div>
              <Button className="w-full gap-2 font-semibold" onClick={() => navigate("/billing")}>
                <CreditCard className="h-4 w-4" /> Make Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {member.payment_history.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">
                  Payment History ({member.payment_history.length})
                </h3>
                <Button variant="link" size="sm" className="text-xs" onClick={() => navigate("/billing")}>
                  View All
                </Button>
              </div>
              <div className="space-y-2">
                {member.payment_history.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">${p.amount}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(p.payment_date).toLocaleDateString()} · {p.payment_method}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-green-200 text-green-700 dark:border-green-800 dark:text-green-400 font-semibold"
                    >
                      Paid
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="outline" className="gap-2 font-semibold flex-1" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button variant="outline" className="gap-2 font-semibold flex-1" onClick={() => navigate(`/units?member=${member.id}`)}>
            <Building2 className="h-4 w-4" /> View Unit
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

export default MemberDetail
