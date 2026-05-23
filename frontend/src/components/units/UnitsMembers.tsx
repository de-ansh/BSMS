import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2, Search, Plus, Eye, Edit3, Mail, Phone, X,
  CreditCard, Send, Users, CalendarDays
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"

interface Unit {
  id: string
  unit_number: string
  building: string
  floor: number
  bedrooms: number
  bathrooms: number
  status: string
  occupant_name: string | null
  maintenance_fee: string
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

interface PaymentRecord {
  id: string
  invoice_id: string
  amount: string
  payment_date: string
  payment_method: string
}

interface MemberDetail {
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

const UnitsMembers = () => {
  const navigate = useNavigate()
  const [units, setUnits] = useState<Unit[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [memberLoading, setMemberLoading] = useState(false)
  const [buildingFilter, setBuildingFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    Promise.all([api.units.list(), api.members.list()])
      .then(([u, m]) => {
        setUnits(u)
        setMembers(m.filter(mm => mm.is_active))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedMemberId) {
      setSelectedMember(null)
      return
    }
    setMemberLoading(true)
    api.members.get(selectedMemberId)
      .then(setSelectedMember)
      .catch(() => setSelectedMember(null))
      .finally(() => setMemberLoading(false))
  }, [selectedMemberId])

  const buildings = [...new Set(units.map(u => u.building))].sort()
  const memberMap = new Map<string, Member>()
  members.forEach(m => {
    if (m.unit_id) memberMap.set(m.unit_id, m)
  })

  const filteredUnits = units.filter(unit => {
    if (buildingFilter !== "all" && unit.building !== buildingFilter) return false
    if (statusFilter !== "all" && unit.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const occupant = unit.occupant_name?.toLowerCase() || ""
      if (!unit.unit_number.toLowerCase().includes(q) && !occupant.includes(q)) return false
    }
    return true
  })

  const handleSelectUnit = (unit: Unit) => {
    const member = memberMap.get(unit.id)
    if (member) {
      setSelectedMemberId(member.id)
    } else {
      setSelectedMemberId(null)
    }
    setSidebarOpen(true)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "occupied": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
      case "vacant": return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      case "maintenance": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "occupied": return "Occupied"
      case "vacant": return "Vacant"
      case "maintenance": return "Maintenance"
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 bg-slate-50 dark:bg-slate-950">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Filter Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b flex flex-wrap items-end gap-4 z-20 shrink-0">
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Building</label>
            <Select value={buildingFilter} onValueChange={setBuildingFilter}>
              <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buildings</SelectItem>
                {buildings.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                placeholder="Search unit or occupant..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-end gap-2 self-end pb-0.5">
            <Button className="gap-2 font-semibold" onClick={() => navigate("/units/new")}>
              <Plus className="h-4 w-4" /> Add Unit
            </Button>
            <Button variant="outline" className="gap-2 font-semibold hidden sm:flex" onClick={() => navigate("/members/new")}>
              <Users className="h-4 w-4" /> Add Member
            </Button>
          </div>
        </div>

        {/* Table Area */}
        <ScrollArea className="flex-1 bg-white dark:bg-slate-900">
          {filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Building2 className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
              <p className="text-lg font-semibold mb-1">No units found</p>
              <p className="text-sm">
                {searchQuery || buildingFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first unit to get started"}
              </p>
              {!searchQuery && buildingFilter === "all" && statusFilter === "all" && (
                <Button className="mt-4 gap-2" onClick={() => navigate("/units/new")}>
                  <Plus className="h-4 w-4" /> Add Unit
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Unit</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500 hidden md:table-cell">Building</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500 hidden sm:table-cell">Floor</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Occupant</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500 hidden md:table-cell">Contact</TableHead>
                  <TableHead className="w-[80px] text-right font-bold text-xs uppercase text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map(unit => {
                  const member = memberMap.get(unit.id)
                  const isSelected = selectedMemberId === member?.id
                  return (
                    <TableRow
                      key={unit.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                      onClick={() => handleSelectUnit(unit)}
                    >
                      <TableCell className="py-4 font-bold text-slate-900 dark:text-white">
                        {unit.unit_number}
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium text-sm hidden md:table-cell">
                        {unit.building}
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium text-sm hidden sm:table-cell">
                        {unit.floor}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${getStatusStyle(unit.status)} border-none font-semibold text-[10px] py-0.5 px-2.5 uppercase tracking-wide`}>
                          {getStatusLabel(unit.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member ? (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                              <AvatarFallback className="text-[10px]">
                                {member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm text-slate-900 dark:text-white truncate max-w-[140px]">
                              {member.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-sm font-medium">Unoccupied</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs hidden md:table-cell">
                        {member?.phone || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary"
                            onClick={e => { e.stopPropagation(); navigate(`/units/${unit.id}`) }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {member && (
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hidden sm:inline-flex"
                              onClick={e => { e.stopPropagation(); navigate(`/members/${member.id}`) }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </div>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => { setSidebarOpen(false); setSelectedMemberId(null) }}
        />
      )}

      {/* Detail Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 right-0 z-50
        w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800
        flex flex-col shadow-2xl
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        ${!selectedMemberId && !sidebarOpen ? "lg:w-0 lg:border-0 lg:overflow-hidden" : ""}
      `}>
        {/* Mobile close button */}
        <Button
          variant="ghost" size="icon"
          className="absolute right-4 top-4 text-slate-400 z-10 lg:hidden"
          onClick={() => { setSidebarOpen(false); setSelectedMemberId(null) }}
        >
          <X className="h-5 w-5" />
        </Button>

        {!selectedMemberId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <Building2 className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
            <p className="text-lg font-semibold text-slate-500">No member selected</p>
            <p className="text-sm mt-1">Click on a unit row to view member details</p>
          </div>
        ) : memberLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse space-y-6 w-full p-8">
              <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto w-28" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mx-auto" />
              <div className="space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
              </div>
            </div>
          </div>
        ) : selectedMember ? (
          <>
            <ScrollArea className="flex-1">
              {/* Profile Header */}
              <div className="p-8 border-b text-center space-y-4">
                <div className="inline-block relative">
                  <Avatar className="h-28 w-28 border-4 border-slate-50 dark:border-slate-800 shadow-xl">
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {selectedMember.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {selectedMember.is_active && (
                    <span className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedMember.name}</h2>
                  <p className="text-sm text-slate-500 font-medium">
                    Unit {selectedMember.unit_number || "—"}
                    {selectedMember.is_owner ? " • Owner" : " • Tenant"}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Contact */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Contact</h3>
                  <div className="space-y-3">
                    <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={selectedMember.email} />
                    <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={selectedMember.phone} />
                  </div>
                </div>

                {/* Unit Details */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Unit & Membership</h3>
                  <Card className="bg-slate-50/50 dark:bg-slate-800/30 border-none shadow-none">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Payment Status</span>
                        <Badge variant="secondary" className={`${
                          Number(selectedMember.outstanding_balance) > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        } gap-1.5 py-1 border-none`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            Number(selectedMember.outstanding_balance) > 0 ? "bg-amber-500" : "bg-emerald-500"
                          }`} />
                          {Number(selectedMember.outstanding_balance) > 0 ? "Outstanding" : "Current"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Building</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedMember.building || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Maintenance Fee</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {selectedMember.maintenance_fee ? `$${selectedMember.maintenance_fee}` : "—"}
                          </p>
                        </div>
                      </div>
                      {selectedMember.move_in_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-500 font-medium">Move-in: </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {new Date(selectedMember.move_in_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Outstanding Balance */}
                {Number(selectedMember.outstanding_balance) > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Outstanding Balance</h3>
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30">
                      <p className="text-[10px] font-bold uppercase text-rose-500 mb-1">Amount Due</p>
                      <p className="text-3xl font-bold font-mono text-rose-600 dark:text-rose-400">
                        ${Number(selectedMember.outstanding_balance).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment History */}
                {selectedMember.payment_history.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">
                      Recent Payments ({selectedMember.payment_history.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedMember.payment_history.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">${p.amount}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(p.payment_date).toLocaleDateString()} &middot; {p.payment_method}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-green-200 text-green-700 dark:border-green-800 dark:text-green-400 font-semibold">
                            Paid
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="p-6 border-t bg-slate-50/50 dark:bg-slate-900/50 space-y-3 shrink-0">
              <Button className="w-full h-11 font-bold gap-2" onClick={() => navigate(`/members/${selectedMember.id}`)}>
                <Eye className="h-4 w-4" /> View Full Profile
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11 font-bold gap-2 text-xs" onClick={() => navigate(`/billing?member_id=${selectedMember.id}`)}>
                  <CreditCard className="h-4 w-4" /> Ledger
                </Button>
                <Button variant="outline" className="h-11 font-bold gap-2 text-xs" onClick={() => navigate("/notices", { state: { compose: true } })}>
                  <Send className="h-4 w-4" /> Send Notice
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <Users className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
            <p className="text-lg font-semibold text-slate-500">Failed to load member</p>
            <p className="text-sm mt-1">Could not fetch member details</p>
            <Button variant="outline" className="mt-4" onClick={() => setSelectedMemberId(null)}>
              Dismiss
            </Button>
          </div>
        )}
      </aside>
    </div>
  )
}

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 group">
    <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{value}</p>
    </div>
  </div>
)

export default UnitsMembers
