import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ClipboardList, Plus, Clock, User, ShieldAlert, Wrench, Zap, Shield, Trash2, HeartHandshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

interface Complaint {
  id: string
  title: string
  description: string
  category: string
  status: string
  assigned_staff_id: string | null
  created_at: string
  resident?: { name: string; email: string }
  assigned_staff?: { name: string; position: string }
}

const ComplaintList = () => {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("resident")
  const [statusTab, setStatusTab] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const load = () => {
    setLoading(true)
    api.complaints.list()
      .then(setComplaints)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.auth.me().then(u => setUserRole(u.role)).catch(console.error)
    load()
  }, [])

  useEffect(() => {
    let result = complaints

    if (statusTab !== "all") {
      result = result.filter(c => c.status === statusTab)
    }

    if (categoryFilter !== "all") {
      result = result.filter(c => c.category.toLowerCase() === categoryFilter.toLowerCase())
    }

    setFilteredComplaints(result)
  }, [complaints, statusTab, categoryFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 uppercase tracking-widest text-[10px]">Pending</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/50 uppercase tracking-widest text-[10px]">In Progress</Badge>
      case "resolved":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 uppercase tracking-widest text-[10px] shadow-[0_0_10px_rgba(52,211,153,0.3)]">Resolved</Badge>
      default:
        return <Badge variant="secondary" className="uppercase tracking-widest text-[10px]">{status}</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "plumbing":
        return <Wrench className="h-4 w-4 text-sky-400" />
      case "electrical":
        return <Zap className="h-4 w-4 text-yellow-400" />
      case "security":
        return <Shield className="h-4 w-4 text-red-400" />
      case "cleaning":
        return <HeartHandshake className="h-4 w-4 text-emerald-400" />
      default:
        return <ClipboardList className="h-4 w-4 text-slate-400" />
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase">Helpdesk & Complaints</h1>
            <p className="text-sm text-slate-400 mt-1 font-light tracking-wider uppercase">
              {userRole === "admin" ? "Manage and resolve resident service tickets" : "Raise and track maintenance requests"}
            </p>
          </div>
          {userRole === "resident" && (
            <Button 
              className="gap-2 font-bold tracking-widest uppercase bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] border border-primary transition-all duration-300"
              onClick={() => navigate("/helpdesk/new")}
            >
              <Plus className="h-4 w-4" /> New Ticket
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 p-4 rounded-xl glass-card">
          <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full md:w-auto">
            <TabsList className="bg-black/20 border border-white/10 p-1 flex overflow-x-auto h-auto">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all text-xs">All Tickets</TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all text-xs">Pending</TabsTrigger>
              <TabsTrigger value="in_progress" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all text-xs">In Progress</TabsTrigger>
              <TabsTrigger value="resolved" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all text-xs">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="w-full md:w-48">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3].map(i => <div key={i} className="h-44 bg-white/5 border border-white/10 rounded-xl animate-pulse" />)}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 flex flex-col items-center text-slate-400">
              <div className="w-16 h-16 mb-4 bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-2xl flex items-center justify-center">
                <ClipboardList className="h-8 w-8 text-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
              </div>
              <p className="font-bold text-lg mb-2 text-white tracking-widest uppercase">No Tickets Found</p>
              <p className="text-sm mb-6 font-light text-center">There are no complaints matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredComplaints.map(complaint => (
              <Card key={complaint.id} className="glass-card hover:border-white/30 transition-all flex flex-col justify-between">
                <CardContent className="p-6 flex flex-col h-full space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        {getCategoryIcon(complaint.category)}
                      </div>
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{complaint.category}</span>
                    </div>
                    {getStatusBadge(complaint.status)}
                  </div>

                  <div className="space-y-2 flex-1">
                    <h3 className="font-bold text-white text-lg tracking-wide uppercase truncate">{complaint.title}</h3>
                    <p className="text-sm text-slate-400 font-light line-clamp-3 leading-relaxed">{complaint.description}</p>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(complaint.created_at)}
                      </span>
                      {complaint.resident && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {complaint.resident.name}
                        </span>
                      )}
                    </div>
                    {complaint.assigned_staff ? (
                      <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 p-2 rounded-lg text-xs text-primary">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span className="font-medium">Assigned: {complaint.assigned_staff.name} ({complaint.assigned_staff.position})</span>
                      </div>
                    ) : (
                      <div className="bg-yellow-500/5 border border-yellow-500/20 p-2 rounded-lg text-xs text-yellow-400">
                        <span className="font-medium">Unassigned</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full mt-2 text-xs uppercase tracking-widest font-bold bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                    onClick={() => navigate(`/helpdesk/${complaint.id}`)}
                  >
                    View Ticket Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

export default ComplaintList
