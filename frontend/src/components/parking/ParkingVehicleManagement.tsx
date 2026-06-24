import { useState, useEffect } from "react"
import {
  Car, Plus, Trash, Search, MapPin, User, CheckCircle, AlertTriangle, Wrench, X, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"

interface Vehicle {
  id: string
  member_id: string
  license_plate: string
  make_model: string
  color: string
  created_at: string
  updated_at: string
  member_name?: string
  unit_number?: string
}

interface ParkingSlot {
  id: string
  building_id: string
  unit_id: string | null
  slot_number: string
  status: string
  created_at: string
  updated_at: string
  unit_number?: string | null
}

interface Unit {
  id: string
  unit_number: string
  building: string
  status: string
}

interface Member {
  id: string
  name: string
  is_active: boolean
}

const ParkingVehicleManagement = () => {
  const [activeTab, setActiveTab] = useState<"vehicles" | "parking">("vehicles")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [userRole, setUserRole] = useState<string>("resident")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Form States
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)
  const [vehiclePlate, setVehiclePlate] = useState("")
  const [vehicleMakeModel, setVehicleMakeModel] = useState("")
  const [vehicleColor, setVehicleColor] = useState("")
  const [vehicleMemberId, setVehicleMemberId] = useState("")
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false)

  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false)
  const [slotNumber, setSlotNumber] = useState("")
  const [slotStatus, setSlotStatus] = useState("available")
  const [slotSubmitting, setSlotSubmitting] = useState(false)

  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null)
  const [allocateUnitId, setAllocateUnitId] = useState<string>("none")
  const [allocateSubmitting, setAllocateSubmitting] = useState(false)

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("")

  const loadData = () => {
    setLoading(true)
    setError("")
    Promise.all([
      api.auth.me(),
      api.vehicles.list(),
      api.parking.listSlots()
    ])
      .then(([me, vehs, slots]) => {
        setUserRole(me.role)
        setVehicles(vehs)
        setParkingSlots(slots)
        
        if (me.role === "admin" || me.role === "super_admin") {
          return Promise.all([api.units.list(), api.members.list()])
            .then(([u, m]) => {
              setUnits(u)
              setMembers(m.filter(x => x.is_active))
            })
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load parking and vehicle data")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setVehicleSubmitting(true)
    setError("")
    try {
      await api.vehicles.create({
        member_id: userRole === "admin" ? vehicleMemberId : undefined,
        license_plate: vehiclePlate,
        make_model: vehicleMakeModel,
        color: vehicleColor,
      })
      setVehiclePlate("")
      setVehicleMakeModel("")
      setVehicleColor("")
      setVehicleMemberId("")
      setIsVehicleModalOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register vehicle")
    } finally {
      setVehicleSubmitting(false)
    }
  }

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return
    try {
      await api.vehicles.delete(id)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vehicle")
    }
  }

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setSlotSubmitting(true)
    setError("")
    try {
      await api.parking.createSlot({
        slot_number: slotNumber,
        status: slotStatus
      })
      setSlotNumber("")
      setSlotStatus("available")
      setIsSlotModalOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create slot")
    } finally {
      setSlotSubmitting(false)
    }
  }

  const handleAllocateSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return
    setAllocateSubmitting(true)
    setError("")
    try {
      const targetUnitId = allocateUnitId === "none" ? null : allocateUnitId
      await api.parking.allocateSlot(selectedSlot.id, targetUnitId)
      setIsAllocateModalOpen(false)
      setSelectedSlot(null)
      setAllocateUnitId("none")
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to allocate slot")
    } finally {
      setAllocateSubmitting(false)
    }
  }

  const handleUpdateStatus = async (slotId: string, status: string) => {
    try {
      await api.parking.updateSlotStatus(slotId, status)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update slot status")
    }
  }

  const getSlotStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">Available</Badge>
      case "allocated":
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]">Allocated</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">Maintenance</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredVehicles = vehicles.filter(v => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      v.license_plate.toLowerCase().includes(q) ||
      v.make_model.toLowerCase().includes(q) ||
      (v.member_name && v.member_name.toLowerCase().includes(q)) ||
      (v.unit_number && v.unit_number.toLowerCase().includes(q))
    )
  })

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
        <div className="h-12 bg-white/5 border border-white/10 rounded-xl w-64" />
        <div className="h-64 bg-white/5 border border-white/10 rounded-xl" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase">Vehicles & Parking</h1>
            <p className="text-sm text-slate-400 mt-1 font-light tracking-wider uppercase">
              {userRole === "admin" ? "Manage resident vehicles and parking spaces" : "Register your vehicle and view parking bays"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              className="gap-2 font-bold tracking-widest uppercase bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.3)] border border-primary transition-all flex-1 sm:flex-none"
              onClick={() => setIsVehicleModalOpen(true)}
            >
              <Plus className="h-4 w-4" /> Register Vehicle
            </Button>
            {userRole === "admin" && (
              <Button
                variant="outline"
                className="gap-2 font-bold tracking-widest uppercase glass hover:border-primary/50 text-white flex-1 sm:flex-none"
                onClick={() => setIsSlotModalOpen(true)}
              >
                <Plus className="h-4 w-4" /> Create Space
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
            {error}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl w-full sm:w-80">
          <button
            onClick={() => setActiveTab("vehicles")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "vehicles"
                ? "bg-primary text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Vehicles
          </button>
          <button
            onClick={() => setActiveTab("parking")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "parking"
                ? "bg-primary text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Parking Grid
          </button>
        </div>

        {/* Tab: Vehicles */}
        {activeTab === "vehicles" && (
          <div className="space-y-4">
            <div className="flex relative max-w-md w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search plate, model, occupant..."
                className="pl-10 bg-white/5 border border-white/10 text-white placeholder:text-slate-500 shadow-none focus-visible:ring-1 focus-visible:ring-primary h-10 w-full"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredVehicles.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-16 flex flex-col items-center text-slate-400">
                  <div className="w-16 h-16 mb-4 bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-2xl flex items-center justify-center">
                    <Car className="h-8 w-8 text-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
                  </div>
                  <p className="font-bold text-lg mb-2 text-white tracking-widest uppercase">No Vehicles</p>
                  <p className="text-sm mb-6 font-light text-center">No registered vehicles found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase text-slate-400">License Plate</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-slate-400">Make / Model</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-slate-400">Color</TableHead>
                      {userRole === "admin" && (
                        <>
                          <TableHead className="font-bold text-xs uppercase text-slate-400">Owner</TableHead>
                          <TableHead className="font-bold text-xs uppercase text-slate-400">Unit</TableHead>
                        </>
                      )}
                      <TableHead className="w-[100px] text-right font-bold text-xs uppercase text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map(vehicle => (
                      <TableRow key={vehicle.id} className="hover:bg-white/5 border-b border-white/5 transition-all">
                        <TableCell className="font-mono font-bold text-white text-sm">
                          {vehicle.license_plate}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm font-semibold">
                          {vehicle.make_model}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          <span className="inline-block w-3.5 h-3.5 rounded-full border border-white/20 mr-2 align-middle" style={{ backgroundColor: vehicle.color.toLowerCase() }} />
                          {vehicle.color}
                        </TableCell>
                        {userRole === "admin" && (
                          <>
                            <TableCell className="text-slate-300 text-sm">
                              {vehicle.member_name || "—"}
                            </TableCell>
                            <TableCell className="text-slate-300 text-sm font-mono">
                              {vehicle.unit_number || "—"}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Parking */}
        {activeTab === "parking" && (
          <div className="space-y-6">
            {parkingSlots.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-16 flex flex-col items-center text-slate-400">
                  <div className="w-16 h-16 mb-4 bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-2xl flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
                  </div>
                  <p className="font-bold text-lg mb-2 text-white tracking-widest uppercase">No Parking Slots</p>
                  <p className="text-sm mb-6 font-light text-center">No parking spaces defined in this building.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {parkingSlots.map(slot => {
                  const isMaintenance = slot.status === "maintenance"
                  const isAllocated = slot.status === "allocated"
                  return (
                    <Card
                      key={slot.id}
                      className={`glass-card hover:-translate-y-1 transition-all ${
                        isMaintenance
                          ? "border-yellow-500/30 hover:border-yellow-500/50"
                          : isAllocated
                          ? "border-primary/30 hover:border-primary/50"
                          : "border-emerald-500/30 hover:border-emerald-500/50"
                      }`}
                    >
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-3 relative">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-bold text-lg text-white">{slot.slot_number}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider mt-1">
                            {getSlotStatusBadge(slot.status)}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400">
                          {slot.unit_number ? (
                            <div className="flex items-center gap-1 bg-white/5 py-1 px-2 rounded font-mono">
                              Unit {slot.unit_number}
                            </div>
                          ) : (
                            <span className="italic font-light">Unassigned</span>
                          )}
                        </div>

                        {userRole === "admin" && (
                          <div className="flex gap-1.5 w-full pt-2 border-t border-white/5">
                            <Button
                              size="sm"
                              className="text-[10px] h-7 px-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 flex-1 uppercase font-bold"
                              onClick={() => {
                                setSelectedSlot(slot)
                                setAllocateUnitId(slot.unit_id || "none")
                                setIsAllocateModalOpen(true)
                              }}
                            >
                              Assign
                            </Button>
                            {isMaintenance ? (
                              <Button
                                size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-400 border border-transparent hover:border-emerald-500/20"
                                onClick={() => handleUpdateStatus(slot.id, "available")}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button
                                size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-yellow-400 border border-transparent hover:border-yellow-500/20"
                                onClick={() => handleUpdateStatus(slot.id, "maintenance")}
                              >
                                <Wrench className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal: Register Vehicle */}
        {isVehicleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-900 border border-white/10 shadow-2xl relative">
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-slate-400 hover:text-white" onClick={() => setIsVehicleModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white uppercase tracking-wide">Register Vehicle</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterVehicle} className="space-y-4">
                  {userRole === "admin" && (
                    <div className="space-y-2">
                      <Label className="text-slate-300">Owner (Member)</Label>
                      <Select value={vehicleMemberId} onValueChange={setVehicleMemberId} required>
                        <SelectTrigger className="bg-white/5 border border-white/10 text-white"><SelectValue placeholder="Select Member" /></SelectTrigger>
                        <SelectContent className="bg-slate-800 text-white border-white/10">
                          {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="plate" className="text-slate-300">License Plate</Label>
                    <Input id="plate" required placeholder="e.g. TX-98765" className="bg-white/5 border border-white/10 text-white" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="makeModel" className="text-slate-300">Make / Model</Label>
                    <Input id="makeModel" required placeholder="e.g. Tesla Model 3" className="bg-white/5 border border-white/10 text-white" value={vehicleMakeModel} onChange={e => setVehicleMakeModel(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-slate-300">Color</Label>
                    <Input id="color" required placeholder="e.g. Blue" className="bg-white/5 border border-white/10 text-white" value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 glass text-white" onClick={() => setIsVehicleModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-primary text-black hover:bg-primary/95" disabled={vehicleSubmitting}>
                      {vehicleSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: Create Slot */}
        {isSlotModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-900 border border-white/10 shadow-2xl relative">
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-slate-400 hover:text-white" onClick={() => setIsSlotModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white uppercase tracking-wide">Create Parking Slot</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSlot} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slotNum" className="text-slate-300">Slot Number / Name</Label>
                    <Input id="slotNum" required placeholder="e.g. P-101" className="bg-white/5 border border-white/10 text-white" value={slotNumber} onChange={e => setSlotNumber(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Initial Status</Label>
                    <Select value={slotStatus} onValueChange={setSlotStatus}>
                      <SelectTrigger className="bg-white/5 border border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 text-white border-white/10">
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 glass text-white" onClick={() => setIsSlotModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-primary text-black hover:bg-primary/95" disabled={slotSubmitting}>
                      {slotSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: Allocate Slot */}
        {isAllocateModalOpen && selectedSlot && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-900 border border-white/10 shadow-2xl relative">
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-slate-400 hover:text-white" onClick={() => setIsAllocateModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white uppercase tracking-wide">Assign Parking Space {selectedSlot.slot_number}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAllocateSlot} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Assign to Unit</Label>
                    <Select value={allocateUnitId} onValueChange={setAllocateUnitId}>
                      <SelectTrigger className="bg-white/5 border border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 text-white border-white/10">
                        <SelectItem value="none">Unassigned (Free Slot)</SelectItem>
                        {units.map(u => (
                          <SelectItem key={u.id} value={u.id}>Unit {u.unit_number} ({u.building})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 glass text-white" onClick={() => setIsAllocateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-primary text-black hover:bg-primary/95" disabled={allocateSubmitting}>
                      {allocateSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Assignment"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

export default ParkingVehicleManagement
