import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, BadgeInfo, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"

const StaffForm = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [position, setPosition] = useState("")
  const [department, setDepartment] = useState("")
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10))
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!id) return
    api.staff.get(id)
      .then((data) => {
        setName(String(data.name || ""))
        setEmail(String(data.email || ""))
        setPhone(String(data.phone || ""))
        setPosition(String(data.position || ""))
        setDepartment(String(data.department || ""))
        setJoinDate(String(data.join_date || "").slice(0, 10) || new Date().toISOString().slice(0, 10))
        setIsActive(data.is_active !== false)
      })
      .catch(() => setError("Failed to load staff member."))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        position: position.trim(),
        department: department.trim(),
        join_date: joinDate,
        ...(isEdit ? { is_active: isActive } : {}),
      }
      const result = isEdit && id
        ? await api.staff.update(id, payload)
        : await api.staff.create(payload)
      navigate(`/staff/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save staff member")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(isEdit && id ? `/staff/${id}` : "/staff")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {isEdit ? "Edit Staff" : "Add Staff"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit ? "Update staff profile" : "Add a new team member"}
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BadgeInfo className="h-5 w-5 text-primary" />
              Staff Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} disabled={submitting} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input id="position" required placeholder="Security Guard" value={position} onChange={(e) => setPosition(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" required placeholder="Security" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={submitting} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input id="joinDate" type="date" required value={joinDate} onChange={(e) => setJoinDate(e.target.value)} disabled={submitting} />
              </div>

              {isEdit && (
                <div className="flex items-center gap-2">
                  <Checkbox id="isActive" checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} disabled={submitting} />
                  <Label htmlFor="isActive" className="cursor-pointer">Active employee</Label>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(isEdit && id ? `/staff/${id}` : "/staff")} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : isEdit ? "Save Changes" : "Create Staff"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

export default StaffForm
