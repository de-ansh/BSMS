import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Eye, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

const StaffList = () => {
  const navigate = useNavigate()
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    api.staff.list()
      .then(setStaffList)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredStaff = staffList.filter((member) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      member.name.toLowerCase().includes(q) ||
      member.email.toLowerCase().includes(q) ||
      member.position.toLowerCase().includes(q) ||
      member.department.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Staff</h1>
          <p className="text-sm text-slate-500 mt-1">{staffList.length} team members</p>
        </div>
        <Button className="gap-2 font-semibold w-full sm:w-auto" onClick={() => navigate("/staff/new")}>
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border rounded-xl p-4">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            placeholder="Search by name, role, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
          <p className="text-lg font-semibold mb-1">No staff found</p>
          <p className="text-sm">
            {searchQuery ? "Try adjusting your search" : "Add your first staff member to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {filteredStaff.map((member) => (
              <Card
                key={member.id}
                className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/staff/${member.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{member.name}</p>
                      <p className="text-xs text-slate-500 truncate">{member.position}</p>
                    </div>
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
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden lg:block bg-white dark:bg-slate-900 border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Position</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Department</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Contact</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">Status</TableHead>
                  <TableHead className="w-[80px] text-right font-bold text-xs uppercase text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow
                    key={member.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                    onClick={() => navigate(`/staff/${member.id}`)}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{member.name}</p>
                          <p className="text-[10px] text-slate-400">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-300">{member.position}</TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-300">{member.department}</TableCell>
                    <TableCell className="text-sm font-mono text-slate-500">{member.phone}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/staff/${member.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

export default StaffList
