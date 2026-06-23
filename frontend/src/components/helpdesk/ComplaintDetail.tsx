import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Clock, User, ShieldCheck, MessageSquare, Send, CheckCircle, Wrench, AlertTriangle, Play, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

interface Comment {
  id: string
  complaint_id: string
  user_id: string
  comment: string
  created_at: string
  user: { name: string; email: string; role: string }
}

interface Complaint {
  id: string
  title: string
  description: string
  category: string
  status: string
  assigned_staff_id: string | null
  created_at: string
  updated_at: string
  resident?: { id: string; name: string; email: string; role: string }
  assigned_staff?: { id: string; name: string; position: string; department: string }
  comments: Comment[]
}

interface Staff {
  id: string
  name: string
  position: string
  department: string
  is_active: boolean
}

const ComplaintDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userRole, setUserRole] = useState<string>("resident")
  const [currentUserId, setCurrentUserId] = useState<string>("")
  
  // Admin Action States
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [statusVal, setStatusVal] = useState<string>("")
  const [staffVal, setStaffVal] = useState<string>("none")
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState("")

  // Comment Form States
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState("")

  const loadTicket = async () => {
    if (!id) return
    try {
      const ticket = await api.complaints.get(id)
      setComplaint(ticket)
      setStatusVal(ticket.status)
      setStaffVal(ticket.assigned_staff_id || "none")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket details")
    }
  }

  const loadInitial = async () => {
    setLoading(true)
    setError("")
    try {
      const me = await api.auth.me()
      setUserRole(me.role)
      setCurrentUserId(me.id)

      await loadTicket()

      if (me.role === "admin") {
        const staffData = await api.staff.list()
        setStaffList(staffData.filter((s: Staff) => s.is_active))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize details view")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitial()
  }, [id])

  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setUpdating(true)
    setUpdateError("")
    try {
      await api.complaints.update(id, {
        status: statusVal,
        assigned_staff_id: staffVal === "none" ? null : staffVal,
      })
      await loadTicket()
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update ticket settings")
    } finally {
      setUpdating(false)
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !newComment.trim()) return
    setSubmittingComment(true)
    setCommentError("")
    try {
      await api.complaints.addComment(id, newComment)
      setNewComment("")
      await loadTicket()
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to post comment")
    } finally {
      setSubmittingComment(false)
    }
  }

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

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/10 rounded" />
        <div className="h-48 bg-white/5 border border-white/10 rounded-xl" />
        <div className="h-64 bg-white/5 border border-white/10 rounded-xl" />
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto text-center py-20 text-slate-400">
        <p className="text-lg font-semibold mb-2 text-red-500">Error loading ticket</p>
        <p className="text-sm mb-4">{error || "Ticket not found"}</p>
        <Button variant="outline" className="glass" onClick={() => navigate("/helpdesk")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Helpdesk
        </Button>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="glass text-slate-300 hover:text-white" onClick={() => navigate("/helpdesk")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase truncate max-w-lg md:max-w-xl">{complaint.title}</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">TICKET ID: {complaint.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description & Specs */}
            <Card className="glass-card">
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs uppercase tracking-wider">Category:</span>
                    <Badge variant="outline" className="text-primary border-primary/30 uppercase tracking-widest text-[10px]">{complaint.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs uppercase tracking-wider">Status:</span>
                    {getStatusBadge(complaint.status)}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Problem Description</h3>
                  <p className="text-white text-sm leading-relaxed font-light whitespace-pre-wrap bg-black/20 p-4 rounded-lg border border-white/5">{complaint.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-400 pt-4 border-t border-white/10">
                  <div>
                    <span className="text-slate-500 uppercase block tracking-wider mb-1">Filed On</span>
                    <span>{formatDateTime(complaint.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block tracking-wider mb-1">Last Updated</span>
                    <span>{formatDateTime(complaint.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments thread */}
            <Card className="glass-card">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> Activity & Update History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* List of comments */}
                <div className="p-6 space-y-6 max-h-[350px] overflow-y-auto">
                  {complaint.comments.length === 0 ? (
                    <p className="text-center py-6 text-sm text-slate-500 italic">No updates or comments posted yet.</p>
                  ) : (
                    complaint.comments.map(c => (
                      <div key={c.id} className={`flex flex-col gap-1 p-3 rounded-lg ${c.user_id === currentUserId ? 'bg-primary/5 border border-primary/20 self-end ml-10' : 'bg-white/5 border border-white/10 mr-10'}`}>
                        <div className="flex items-center justify-between gap-4 text-xs font-mono text-slate-400">
                          <span className="font-bold text-white flex items-center gap-1">
                            {c.user.name} 
                            <Badge variant="outline" className={`text-[8px] px-1 py-0 ${c.user.role === 'admin' ? 'text-primary border-primary/30' : 'text-slate-400 border-white/10'}`}>{c.user.role.toUpperCase()}</Badge>
                          </span>
                          <span>{formatDateTime(c.created_at)}</span>
                        </div>
                        <p className="text-sm font-light text-slate-200 mt-2 whitespace-pre-wrap">{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Post comment form */}
                <form onSubmit={handlePostComment} className="p-4 bg-black/30 border-t border-white/10 flex flex-col gap-2">
                  {commentError && (
                    <div className="text-xs text-red-400">{commentError}</div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Post a question, answer, or update..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={submittingComment}
                      className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary flex-1 text-sm h-10"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={submittingComment || !newComment.trim()}
                      className="bg-primary text-black hover:bg-primary/90 h-10 w-10 shrink-0"
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Reporter Card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Resident Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {complaint.resident ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{complaint.resident.name}</p>
                      <p className="text-xs text-slate-400">{complaint.resident.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No resident profile available</p>
                )}
              </CardContent>
            </Card>

            {/* Assigned Staff Card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Assigned Staff</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {complaint.assigned_staff ? (
                  <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/30">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{complaint.assigned_staff.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{complaint.assigned_staff.position}</p>
                      <p className="text-[10px] text-slate-500 font-light mt-0.5">{complaint.assigned_staff.department}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg text-center">
                    <p className="text-xs text-yellow-400 font-medium">Unassigned Ticket</p>
                    <p className="text-[10px] text-slate-500 font-light mt-1">Pending admin staff assignment.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Management Panel */}
            {userRole === "admin" && (
              <Card className="glass-card border-primary/20">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Manage Ticket</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAdminUpdate} className="space-y-4">
                    {updateError && (
                      <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-xs">{updateError}</div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-slate-300 uppercase tracking-widest text-xs font-bold">Update Status</Label>
                      <Select value={statusVal} onValueChange={setStatusVal}>
                        <SelectTrigger id="status-trigger" className="bg-black/20 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staff" className="text-slate-300 uppercase tracking-widest text-xs font-bold">Assign Staff</Label>
                      <Select value={staffVal} onValueChange={setStaffVal}>
                        <SelectTrigger id="staff-trigger" className="bg-black/20 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="none">Unassigned / None</SelectItem>
                          {staffList.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.position})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={updating}
                      className="w-full font-bold tracking-widest uppercase bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all text-xs h-9 mt-2"
                    >
                      {updating ? "Saving..." : "Save Settings"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export default ComplaintDetail
