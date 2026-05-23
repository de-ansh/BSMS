import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Mail, Phone, BadgeInfo, ChevronLeft, ChevronRight, Edit3, Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { api } from "@/lib/api"

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  is_active: boolean
}

const RESERVED_IDS = new Set(["new", "edit"])

const StaffProfile = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || RESERVED_IDS.has(id)) {
      navigate("/staff", { replace: true })
      return
    }
    setLoading(true)
    Promise.all([
      api.staff.get(id).then((data) => data as unknown as StaffMember),
      api.staff.list(),
    ])
      .then(([s, list]) => {
        setStaff(s)
        setStaffList(list)
      })
      .catch(() => navigate("/staff"))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const currentIndex = staffList.findIndex((s) => s.id === id)
  const prevStaff = currentIndex > 0 ? staffList[currentIndex - 1] : null
  const nextStaff = currentIndex < staffList.length - 1 ? staffList[currentIndex + 1] : null

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full h-full overflow-y-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-32" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full h-full overflow-y-auto flex flex-col items-center justify-center py-20 text-slate-400">
        <BadgeInfo className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
        <p className="text-lg font-semibold mb-1">Staff member not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/staff")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Staff
        </Button>
      </div>
    )
  }

  const initials = staff.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full h-full overflow-y-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/staff")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={!prevStaff} onClick={() => prevStaff && navigate(`/staff/${prevStaff.id}`)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={!nextStaff} onClick={() => nextStaff && navigate(`/staff/${nextStaff.id}`)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline" className="gap-2 font-semibold" onClick={() => navigate(`/staff/${staff.id}/edit`)}>
          <Edit3 className="h-4 w-4" /> Edit Profile
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-slate-50 dark:border-slate-800 shadow-xl shrink-0">
              <AvatarFallback className="text-2xl md:text-3xl bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{staff.name}</h1>
                <Badge variant="secondary" className={`border-none font-semibold text-xs ${staff.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                  {staff.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-base text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-2">
                <BadgeInfo className="h-4 w-4 shrink-0" /> {staff.position}
              </p>
              <p className="text-sm text-slate-500 font-medium">{staff.department}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{staff.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Phone</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{staff.phone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Department & Role</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Department</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{staff.department}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Position</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{staff.position}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Attendance & Activity</h3>
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Calendar className="h-12 w-12 mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold text-slate-500">Attendance tracking coming soon</p>
            <p className="text-xs mt-1">This feature will be available in a future update</p>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="gap-2 font-semibold w-full sm:w-auto" onClick={() => navigate("/staff")}>
        <ArrowLeft className="h-4 w-4" /> Back to Staff
      </Button>
    </div>
  )
}

export default StaffProfile
