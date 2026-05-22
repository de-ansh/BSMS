import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ShieldCheck, Search, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

interface AuditEntry {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  details: string | null
  created_at: string
}

const actionOptions = ["create", "update", "delete", "login", "logout"]
const entityOptions = ["member", "unit", "staff", "invoice", "payment", "notice", "user"]

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const getActionColor = (action: string) => {
  switch (action) {
    case "create": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "update": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    case "delete": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    case "login": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
    case "logout": return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400"
    default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
  }
}

const AuditLog = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const perPage = 10

  const actionFilter = searchParams.get("action") || "all"
  const entityFilter = searchParams.get("entity_type") || "all"
  const searchQuery = searchParams.get("q") || ""

  useEffect(() => {
    setLoading(true)
    api.auditLog.list({
      action: actionFilter !== "all" ? actionFilter : undefined,
      entity_type: entityFilter !== "all" ? entityFilter : undefined,
    })
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [actionFilter, entityFilter])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== "all") params.set(key, value)
    else params.delete(key)
    setSearchParams(params)
    setPage(1)
  }

  const filteredLogs = logs.filter(entry => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const searchable = [entry.action, entry.entity_type, entry.details, entry.user_id].filter(Boolean).join(" ").toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / perPage))
  const paginatedLogs = filteredLogs.slice((page - 1) * perPage, page * perPage)

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1">{filteredLogs.length} total entries</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Action</label>
          <Select value={actionFilter} onValueChange={(v) => updateFilter("action", v)}>
            <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionOptions.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Entity Type</label>
          <Select value={entityFilter} onValueChange={(v) => updateFilter("entity_type", v)}>
            <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityOptions.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => updateFilter("q", e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <ShieldCheck className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
          <p className="text-lg font-semibold mb-1">No audit entries found</p>
          <p className="text-sm">
            {searchQuery || (actionFilter !== "all") || (entityFilter !== "all")
              ? "Try adjusting your filters"
              : "No activity has been recorded yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {paginatedLogs.map(entry => (
              <Card key={entry.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className={`${getActionColor(entry.action)} border-none font-semibold text-[10px] uppercase`}>
                      {entry.action}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-mono">{entry.entity_type}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                    {entry.details || "No details"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{formatDate(entry.created_at)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden lg:block bg-white dark:bg-slate-900 border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Action</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Entity</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Details</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map(entry => (
                  <TableRow key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                    <TableCell>
                      <Badge variant="secondary" className={`${getActionColor(entry.action)} border-none font-semibold text-[10px] uppercase`}>
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm text-slate-700 dark:text-slate-300">
                      {entry.entity_type}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 max-w-md truncate">
                      {entry.details || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 font-mono text-xs">
                      {formatDate(entry.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AuditLog
