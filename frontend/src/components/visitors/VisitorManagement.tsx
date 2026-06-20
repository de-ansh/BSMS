import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Users, Plus, ShieldCheck, DoorOpen, DoorClosed, Clock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"

interface Visitor {
  id: string
  visitor_name: string
  phone: string | null
  purpose: string | null
  status: string
  expected_arrival: string | null
  check_in_time: string | null
  check_out_time: string | null
  created_at: string
}

const VisitorManagement = () => {
  const navigate = useNavigate()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("resident")

  const load = () => {
    setLoading(true)
    api.visitors.list()
      .then(setVisitors)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.auth.me().then(u => setUserRole(u.role)).catch(console.error)
    load()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.visitors.updateStatus(id, status)
      load()
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">Pending</Badge>
      case "approved":
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/50">Pre-Approved</Badge>
      case "checked_in":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(52,211,153,0.3)]">Checked In</Badge>
      case "checked_out":
        return <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/50">Checked Out</Badge>
      case "denied":
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/50">Denied</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase">Visitor Management</h1>
            <p className="text-sm text-slate-400 mt-1 font-light tracking-wider uppercase">
              {userRole === "admin" ? "Monitor and log building visitors" : "Pre-approve your expected guests"}
            </p>
          </div>
          <Button 
            className="gap-2 font-bold tracking-widest uppercase bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] border border-primary transition-all duration-300"
            onClick={() => navigate("/visitors/new")}
          >
            <Plus className="h-4 w-4" /> {userRole === "admin" ? "Log Visitor" : "Pre-Approve"}
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 border border-white/10 rounded-xl animate-pulse" />)}
          </div>
        ) : visitors.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 flex flex-col items-center text-slate-400">
              <div className="w-16 h-16 mb-4 bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-2xl flex items-center justify-center">
                <Users className="h-8 w-8 text-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
              </div>
              <p className="font-bold text-lg mb-2 text-white tracking-widest uppercase">No Visitors</p>
              <p className="text-sm mb-6 font-light text-center">No visitor logs found. Create an entry to begin tracking.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visitors.map(visitor => (
              <Card key={visitor.id} className="glass-card hover:border-white/30 transition-all flex flex-col">
                <CardContent className="p-6 flex flex-col h-full space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-white text-lg tracking-wide uppercase truncate">{visitor.visitor_name}</h3>
                      <p className="text-xs text-slate-400 uppercase tracking-widest mt-1 font-mono">{visitor.phone || "No Phone"}</p>
                    </div>
                    {getStatusBadge(visitor.status)}
                  </div>
                  
                  <div className="space-y-1 text-sm text-slate-300 flex-1">
                    <p><span className="text-slate-500 uppercase text-xs tracking-wider">Purpose:</span> {visitor.purpose || "N/A"}</p>
                    {visitor.expected_arrival && (
                      <p className="flex items-center gap-1 text-xs text-primary mt-2">
                        <Clock className="w-3 h-3" /> Expected: {visitor.expected_arrival}
                      </p>
                    )}
                  </div>

                  {userRole === "admin" && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10 mt-auto">
                      {visitor.status === "pending" || visitor.status === "approved" ? (
                        <>
                          <Button size="sm" className="flex-1 gap-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50" onClick={() => updateStatus(visitor.id, "checked_in")}>
                            <DoorOpen className="w-4 h-4" /> Check In
                          </Button>
                          <Button size="sm" className="gap-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50" onClick={() => updateStatus(visitor.id, "denied")}>
                            <XCircle className="w-4 h-4" /> Deny
                          </Button>
                        </>
                      ) : visitor.status === "checked_in" ? (
                        <Button size="sm" className="w-full gap-1 bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 border border-slate-500/50" onClick={() => updateStatus(visitor.id, "checked_out")}>
                          <DoorClosed className="w-4 h-4" /> Check Out
                        </Button>
                      ) : (
                        <div className="text-xs text-slate-500 italic flex-1 text-center py-1">No further actions</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

export default VisitorManagement
