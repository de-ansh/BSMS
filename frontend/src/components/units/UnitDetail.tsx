import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Building2, Users, Edit3, MapPin, DollarSign, BedDouble, Bath, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api"

const RESERVED_IDS = new Set(["new", "edit"])

interface UnitData {
  id: string
  unit_number: string
  building: string
  floor: number
  bedrooms: number
  bathrooms: number
  status: string
  occupant_name: string | null
  occupant_id?: string | null
  maintenance_fee: string
}

const UnitDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [unit, setUnit] = useState<UnitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    if (!id || RESERVED_IDS.has(id)) return
    setLoading(true)
    api.units
      .get(id)
      .then((data) => {
        const u = data as unknown as UnitData
        setUnit(u)
        setStatus(u.status)
      })
      .catch(() => navigate("/members"))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !unit) return
    setStatus(newStatus)
    setSavingStatus(true)
    try {
      await api.units.update(id, { status: newStatus })
      setUnit({ ...unit, status: newStatus })
    } catch {
      setStatus(unit.status)
    } finally {
      setSavingStatus(false)
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
      case "vacant":
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
      case "maintenance":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "occupied":
        return "Occupied"
      case "vacant":
        return "Vacant"
      case "maintenance":
        return "Maintenance"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-64" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!unit) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center py-20 text-slate-400">
        <Building2 className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
        <p className="text-lg font-semibold mb-1">Unit not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/members")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Units
        </Button>
      </div>
    )
  }

  const occupantInitials = unit.occupant_name
    ? unit.occupant_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : ""

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        <Breadcrumb className="mb-2">
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate("/dashboard")}>Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate("/members")}>Units & Members</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{unit.unit_number}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/members")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              Unit {unit.unit_number}
            </h1>
            <Badge variant="outline" className={`${getStatusStyle(unit.status)} border font-semibold text-[10px] py-0.5 px-2.5 uppercase tracking-wide`}>
              {getStatusLabel(unit.status)}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 font-semibold text-xs sm:text-sm" onClick={() => navigate(`/units/${unit.id}/edit`)}>
              <Edit3 className="h-4 w-4" /> Edit Unit
            </Button>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={handleStatusChange} disabled={savingStatus}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              {savingStatus && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  Unit {unit.unit_number}
                </h2>
                <p className="text-base text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {unit.building} · Floor {unit.floor}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5" /> {unit.bedrooms} Bed
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" /> {unit.bathrooms} Bath
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" /> {unit.maintenance_fee}/mo
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Building</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{unit.building}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Floor</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{unit.floor}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Bedrooms</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{unit.bedrooms}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Bathrooms</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{unit.bathrooms}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Status</p>
                  <Badge variant="outline" className={`${getStatusStyle(unit.status)} border font-semibold text-[10px]`}>
                    {getStatusLabel(unit.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Maintenance Fee</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">${unit.maintenance_fee}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Occupant</h3>
              {unit.occupant_name ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-slate-100 dark:border-slate-800">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {occupantInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{unit.occupant_name}</p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs font-semibold"
                        onClick={() => unit.occupant_id && navigate(`/members/${unit.occupant_id}`)}
                      >
                        <Users className="h-3 w-3 mr-1" /> View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                  <Users className="h-10 w-10 mb-2 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-semibold text-slate-500">Unoccupied</p>
                  <p className="text-xs mt-1">This unit is currently vacant</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="outline" className="gap-2 font-semibold flex-1" onClick={() => navigate("/members")}>
            <ArrowLeft className="h-4 w-4" /> Back to Units
          </Button>
          {unit.occupant_id && (
            <Button
              variant="default"
              className="gap-2 font-semibold flex-1"
              onClick={() => navigate(`/members/${unit.occupant_id}`)}
            >
              <Users className="h-4 w-4" /> View Occupant Details
            </Button>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

export default UnitDetail
