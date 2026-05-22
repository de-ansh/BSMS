import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2, Users, CreditCard, PlusSquare, ArrowRight, LogOut, BadgeInfo,
  BadgeAlert, CalendarDays
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/lib/api"

interface NoticeItem {
  id: string
  title: string
  priority: string
  published_at: string | null
  created_at: string
}

interface UnitBlockItem {
  id: string
  unit_number: string
  status: string
  occupant_name: string | null
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total_units: 0, occupied_units: 0, vacancy_rate: "0%",
    pending_payments: "0", overdue_count: 0, staff_on_duty: 0,
    total_members: 0, total_staff: 0,
  })
  const [units, setUnits] = useState<UnitBlockItem[]>([])
  const [notices, setNotices] = useState<NoticeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.dashboard.stats(),
      api.units.list(),
      api.notices.list(),
    ])
      .then(([s, u, n]) => {
        setStats(s)
        setUnits(u.slice(0, 20))
        setNotices(n.slice(0, 5))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-20 bg-slate-200 dark:bg-slate-800 rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Units" value={stats.total_units.toString()} subtext={`${stats.occupied_units} occupied`} icon={<Building2 />} color="blue" />
        <StatCard label="Occupancy" value={stats.vacancy_rate} subtext={`${stats.occupied_units}/${stats.total_units} Units`} icon={<Users />} color="emerald" />
        <StatCard label="Pending Payments" value={`$${stats.pending_payments}`} subtext={`${stats.overdue_count} Overdue`} icon={<CreditCard />} color="amber" />
        <StatCard label="Staff On Duty" value={stats.staff_on_duty.toString()} subtext="Active" icon={<BadgeInfo />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 md:pb-6">
            <CardTitle className="text-lg font-bold">Unit & Occupancy Overview</CardTitle>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <LegendItem color="bg-primary" label="Occupied" />
              <LegendItem color="bg-slate-200 dark:bg-slate-700" label="Vacant" />
              <LegendItem color="bg-amber-500" label="Maintenance" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 md:gap-3">
              {units.map((unit) => (
                <UnitBlock
                  key={unit.id}
                  id={unit.unit_number}
                  status={unit.status as 'occupied' | 'vacant' | 'maintenance'}
                  occupant={unit.occupant_name}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t py-4">
            <Button variant="link" className="text-primary font-semibold gap-2" onClick={() => navigate("/members")}>
              View All Units <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-sm flex flex-col h-[400px] md:h-[480px]">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-bold">Recent Notices</CardTitle>
            <Button variant="link" size="sm" className="text-primary text-xs font-semibold" onClick={() => navigate("/notices")}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-3 py-4">
                {notices.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No notices yet</p>
                )}
                {notices.map((notice) => (
                  <NoticeItem
                    key={notice.id}
                    type={notice.priority === "high" ? "high" : "standard"}
                    title={notice.title}
                    time={notice.published_at || notice.created_at}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t">
            <Button className="w-full gap-2 font-semibold" onClick={() => navigate("/notices")}>
              <PlusSquare className="h-4 w-4" /> Post New Notice
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <ActionButton icon={<PlusSquare />} label="Add Member" primary onClick={() => navigate("/members")} />
          <ActionButton icon={<CreditCard />} label="Generate Bills" onClick={() => navigate("/billing")} />
          <ActionButton icon={<Users />} label="Manage Staff" onClick={() => navigate("/staff")} />
          <ActionButton icon={<LogOut />} label="View Reports" onClick={() => navigate("/audit-log")} />
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ label, value, subtext, icon, color }: {
  label: string; value: string; subtext: string; icon: React.ReactElement; color: string
}) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <span className="text-slate-500 text-xs md:text-sm font-medium uppercase tracking-wider">{label}</span>
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl md:text-3xl font-bold font-mono">{value}</span>
          <span className="text-xs text-slate-400 font-medium truncate">{subtext}</span>
        </div>
      </CardContent>
    </Card>
  )
}

const UnitBlock = ({ id, status, occupant }: { id: string; status: 'occupied' | 'vacant' | 'maintenance'; occupant: string | null }) => {
  const statusStyles = {
    occupied: "bg-primary text-white shadow-lg shadow-primary/20",
    vacant: "bg-slate-100 dark:bg-slate-800 text-slate-500",
    maintenance: "bg-amber-500 text-white shadow-lg shadow-amber-500/20",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${statusStyles[status]} aspect-square rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform`}>
            <span className="font-mono text-[10px] font-bold truncate px-1">{id}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{occupant || "Vacant"}<br />Unit: {id}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const NoticeItem = ({ type, title, time }: { type: string; title: string; time: string }) => {
  return (
    <div className="flex gap-4 p-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all cursor-pointer">
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        type === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
      }`}>
        {type === 'high' ? <BadgeAlert className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] font-bold uppercase mb-0.5 ${type === 'high' ? 'text-red-500' : 'text-slate-400'}`}>
          {type === 'high' ? 'High Priority' : 'Notice'}
        </p>
        <h4 className="text-sm font-semibold truncate leading-none mb-1.5">{title}</h4>
        <p className="text-[10px] text-slate-400 font-medium">{new Date(time).toLocaleDateString()}</p>
      </div>
    </div>
  )
}

const ActionButton = ({ icon, label, primary = false, onClick }: {
  icon: React.ReactElement; label: string; primary?: boolean; onClick?: () => void
}) => (
  <Button
    variant={primary ? "default" : "outline"}
    className="h-auto flex-col items-center gap-2 md:gap-3 p-4 md:p-6 rounded-xl transition-all hover:-translate-y-0.5"
    onClick={onClick}
  >
    {icon}
    <span className="font-semibold text-sm md:text-base">{label}</span>
  </Button>
)

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
    <span className={`w-3 h-3 rounded ${color}`}></span> {label}
  </div>
)

export default Dashboard
