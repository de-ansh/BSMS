import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import {
  Megaphone, Plus, Send, X, Loader2, Trash2,
  BadgeAlert, Info, AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { api } from "@/lib/api"

interface Notice {
  id: string
  title: string
  content: string
  priority: string
  author_id: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getPriorityConfig(priority: string) {
  const configs: Record<string, { label: string; icon: React.ReactNode; color: string; badge: string }> = {
    high: {
      label: "High",
      icon: <BadgeAlert className="h-4 w-4" />,
      color: "text-red-600 bg-red-100 dark:bg-red-900/30",
      badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    },
    medium: {
      label: "Medium",
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    },
    low: {
      label: "Low",
      icon: <Info className="h-4 w-4" />,
      color: "text-slate-600 bg-slate-100 dark:bg-slate-800",
      badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    },
  }
  return configs[priority] || configs.medium
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const NoticesCommunication = () => {
  const location = useLocation()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [composeTitle, setComposeTitle] = useState("")
  const [composeContent, setComposeContent] = useState("")
  const [composePriority, setComposePriority] = useState("medium")
  const [submitting, setSubmitting] = useState(false)

  const fetchNotices = () => {
    setLoading(true)
    setError(null)
    api.notices.list()
      .then(setNotices)
      .catch((error) => {
        setError(error instanceof Error ? error.message : "Unable to load notices.")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  useEffect(() => {
    const state = location.state as { compose?: boolean } | null
    if (state?.compose) {
      setShowCompose(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleDelete = async (id: string) => {
    try {
      await api.notices.delete(id)
      setNotices((prev) => prev.filter((n) => n.id !== id))
    } catch {
      // silently fail
    }
  }

  const handleSubmit = async () => {
    if (!composeTitle.trim() || !composeContent.trim()) return
    setSubmitting(true)
    try {
      await api.notices.create({
        title: composeTitle.trim(),
        content: composeContent.trim(),
        priority: composePriority,
      })
      setShowCompose(false)
      setComposeTitle("")
      setComposeContent("")
      setComposePriority("medium")
      await fetchNotices()
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting) return
    setShowCompose(false)
    setComposeTitle("")
    setComposeContent("")
    setComposePriority("medium")
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-4 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <Megaphone className="text-white h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Notices</h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              {notices.length} {notices.length === 1 ? "notice" : "notices"}
            </p>
          </div>
        </div>
        <Button className="gap-2 font-semibold shadow-lg shadow-primary/20" onClick={() => setShowCompose(true)}>
          <Plus className="h-4 w-4" /> New Notice
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/70 dark:text-red-300">
          <div className="font-semibold">Unable to load notices</div>
          <p className="mt-1">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchNotices}>
            Retry
          </Button>
        </div>
      )}

      {notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
            <Megaphone className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-1">No notices yet</h3>
          <p className="text-sm text-slate-400 mb-6">Create your first notice to communicate with members.</p>
          <Button className="gap-2 font-semibold" onClick={() => setShowCompose(true)}>
            <Plus className="h-4 w-4" /> Create Notice
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/50 p-0 md:p-4">
          <div className="bg-white dark:bg-slate-900 w-full h-full md:h-auto md:max-w-2xl md:rounded-2xl md:shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-lg font-bold">New Notice</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleClose} disabled={submitting}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
                <Input
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  placeholder="Notice title"
                  className="h-12 text-base font-semibold"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority</label>
                <Select value={composePriority} onValueChange={setComposePriority}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Content</label>
                <Textarea
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder="Write the notice content..."
                  className="min-h-[200px] text-base leading-relaxed resize-none"
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0">
              <Button variant="outline" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                className="gap-2 font-semibold"
                onClick={handleSubmit}
                disabled={!composeTitle.trim() || !composeContent.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const NoticeCard = ({ notice, onDelete }: { notice: Notice; onDelete: (id: string) => void }) => {
  const priority = getPriorityConfig(notice.priority)

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 border ${priority.badge}`}>
            {priority.icon}
            <span className="ml-1.5">{priority.label}</span>
          </Badge>
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap shrink-0">
            {formatDate(notice.published_at || notice.created_at)}
          </span>
        </div>

        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2 leading-tight text-base md:text-lg">
          {notice.title}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-3 leading-relaxed mb-4">
          {notice.content}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                {getInitials(notice.author_id || "System")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {notice.author_id || "System"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-500 rounded-lg"
            onClick={() => onDelete(notice.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default NoticesCommunication
