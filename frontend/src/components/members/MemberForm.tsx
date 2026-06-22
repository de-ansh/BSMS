import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"

interface UnitOption {
  id: string
  unit_number: string
  building: string
  status: string
}

const MemberForm = () => {
  const navigate = useNavigate()
  const [units, setUnits] = useState<UnitOption[]>([])
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [unitId, setUnitId] = useState("")
  const [moveInDate, setMoveInDate] = useState("")
  const [isOwner, setIsOwner] = useState(true)

  useEffect(() => {
    api.units.list()
      .then((data) => setUnits(data))
      .catch(() => setError("Failed to load units."))
      .finally(() => setLoadingUnits(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const result = await api.members.create({
        name: name.trim(),
        email: email.trim(),
        password: password ? password : null,
        phone: phone.trim(),
        unit_id: unitId || null,
        move_in_date: moveInDate || null,
        is_owner: isOwner,
      })
      navigate(`/members/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create member")
    } finally {
      setSubmitting(false)
    }
  }

  const assignableUnits = units.filter((u) => u.status === "vacant" || u.id === unitId)

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/members")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Add Member</h1>
            <p className="text-sm text-slate-500 mt-0.5">Register a new society member</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Member Details
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
                <Input
                  id="name"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="john@society.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    required
                    placeholder="+1 555 0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Login Password (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Set password for resident login"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit (optional)</Label>
                  <Select
                    value={unitId}
                    onValueChange={setUnitId}
                    disabled={submitting || loadingUnits}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingUnits ? "Loading units..." : "Select unit"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No unit assigned</SelectItem>
                      {assignableUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.unit_number} · {unit.building}
                          {unit.status !== "vacant" ? ` (${unit.status})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moveInDate">Move-in Date</Label>
                  <Input
                    id="moveInDate"
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isOwner"
                  checked={isOwner}
                  onCheckedChange={(checked) => setIsOwner(checked === true)}
                  disabled={submitting}
                />
                <Label htmlFor="isOwner" className="cursor-pointer">
                  Unit owner (uncheck for tenant)
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/members")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create Member
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

export default MemberForm
