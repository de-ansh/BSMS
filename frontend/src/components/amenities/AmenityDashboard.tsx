import { useState, useEffect } from "react"
import { Calendar, Plus, Clock, User, Check, X, ShieldAlert, BookOpen, AlertTriangle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { api } from "@/lib/api"

interface Amenity {
  id: string
  building_id: string
  name: string
  description: string | null
  rules: string | null
  booking_required: boolean
}

interface Booking {
  id: string
  building_id: string
  amenity_id: string
  resident_id: string
  start_time: string
  end_time: string
  status: string
  amenity?: Amenity
  resident?: { name: string; email: string }
}

const AmenityDashboard = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("resident")
  const [activeTab, setActiveTab] = useState<string>("amenities")

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null)

  // Form States - Add Amenity
  const [amenityForm, setAmenityForm] = useState({
    name: "",
    description: "",
    rules: "",
    booking_required: true,
  })
  const [addError, setAddError] = useState("")
  const [adding, setAdding] = useState(false)

  // Form States - Book Slot
  const [bookingForm, setBookingForm] = useState({
    start_time: "",
    end_time: "",
  })
  const [bookError, setBookError] = useState("")
  const [booking, setBooking] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const me = await api.auth.me()
      setUserRole(me.role)
      const amenitiesData = await api.amenities.list()
      setAmenities(amenitiesData)
      const bookingsData = await api.amenities.listBookings()
      setBookings(bookingsData)
    } catch (err) {
      console.error("Failed to load amenity dashboard data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Admin: Create Amenity
  const handleAddAmenity = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setAddError("")
    try {
      await api.amenities.create(amenityForm)
      setAmenityForm({ name: "", description: "", rules: "", booking_required: true })
      setShowAddModal(false)
      loadData()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to create amenity")
    } finally {
      setAdding(false)
    }
  }

  // Resident: Create Booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAmenity) return
    setBooking(true)
    setBookError("")
    try {
      // Form fields are local datetime format. Convert to proper ISO string
      const startISO = new Date(bookingForm.start_time).toISOString()
      const endISO = new Date(bookingForm.end_time).toISOString()

      await api.amenities.createBooking({
        amenity_id: selectedAmenity.id,
        start_time: startISO,
        end_time: endISO,
      })
      setBookingForm({ start_time: "", end_time: "" })
      setShowBookModal(false)
      setSelectedAmenity(null)
      loadData()
    } catch (err) {
      setBookError(err instanceof Error ? err.message : "Failed to request booking")
    } finally {
      setBooking(false)
    }
  }

  // Admin/Resident: Update Booking Status
  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      await api.amenities.updateBookingStatus(bookingId, newStatus)
      loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update booking status")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 uppercase tracking-widest text-[9px]">Pending</Badge>
      case "approved":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 uppercase tracking-widest text-[9px] shadow-[0_0_8px_rgba(52,211,153,0.3)]">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/50 uppercase tracking-widest text-[9px]">Rejected</Badge>
      case "cancelled":
        return <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/50 uppercase tracking-widest text-[9px]">Cancelled</Badge>
      default:
        return <Badge variant="secondary" className="uppercase tracking-widest text-[9px]">{status}</Badge>
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

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase">Facility & Amenity Booking</h1>
            <p className="text-sm text-slate-400 mt-1 font-light tracking-wider uppercase">
              Book common facilities and manage schedules
            </p>
          </div>
          {userRole === "admin" && (
            <Button 
              className="gap-2 font-bold tracking-widest uppercase bg-primary text-black hover:bg-primary/90 border border-primary shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="h-4 w-4" /> Add Amenity
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 max-w-[400px]">
            <TabsTrigger id="tab-amenities" value="amenities" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all text-sm uppercase tracking-widest font-bold flex-1 py-2">Amenities</TabsTrigger>
            <TabsTrigger id="tab-bookings" value="bookings" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all text-sm uppercase tracking-widest font-bold flex-1 py-2">
              {userRole === "admin" ? "Approvals & History" : "My Bookings"}
            </TabsTrigger>
          </TabsList>

          {/* ================= AMENITIES TAB ================= */}
          <TabsContent value="amenities" className="space-y-6 outline-none">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white/5 border border-white/10 rounded-xl animate-pulse" />)}
              </div>
            ) : amenities.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-16 flex flex-col items-center text-slate-400">
                  <BookOpen className="h-12 w-12 text-slate-500 mb-4" />
                  <p className="font-bold text-lg text-white uppercase tracking-widest">No Amenities Added</p>
                  <p className="text-sm font-light text-center mt-1">There are no common facilities registered for your building.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {amenities.map(amenity => (
                  <Card key={amenity.id} className="glass-card flex flex-col justify-between hover:border-white/30 transition-all">
                    <CardContent className="p-6 flex flex-col h-full justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-white text-lg tracking-wide uppercase">{amenity.name}</h3>
                          <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-white/20 text-slate-400">
                            {amenity.booking_required ? "Booking Required" : "Open Access"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 font-light leading-relaxed">{amenity.description || "No description provided."}</p>
                        {amenity.rules && (
                          <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-primary tracking-widest block">Rules / Policies</span>
                            <p className="text-xs text-slate-400 leading-normal font-light">{amenity.rules}</p>
                          </div>
                        )}
                      </div>

                      {userRole === "resident" && amenity.booking_required && (
                        <Button 
                          className="w-full mt-6 bg-primary text-black hover:bg-primary/95 font-bold uppercase tracking-widest text-xs h-9"
                          onClick={() => {
                            setSelectedAmenity(amenity)
                            setShowBookModal(true)
                          }}
                        >
                          Book Slot
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ================= BOOKINGS TAB ================= */}
          <TabsContent value="bookings" className="outline-none">
            {loading ? (
              <div className="h-64 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
            ) : bookings.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-16 flex flex-col items-center text-slate-400">
                  <Calendar className="h-12 w-12 text-slate-500 mb-4" />
                  <p className="font-bold text-lg text-white uppercase tracking-widest">No Bookings Found</p>
                  <p className="text-sm font-light mt-1">There are no bookings recorded in your history.</p>
                </CardContent>
              </Card>
            ) : userRole === "admin" ? (
              /* ADMIN LEDGER VIEW */
              <div className="space-y-6">
                {/* Pending Bookings Ledger */}
                {bookings.filter(b => b.status === "pending").length > 0 && (
                  <Card className="glass-card border-yellow-500/25">
                    <CardHeader className="bg-yellow-500/5 border-b border-yellow-500/10 py-4">
                      <CardTitle className="text-base font-bold text-yellow-400 flex items-center gap-2 uppercase tracking-wider">
                        <Clock className="w-5 h-5 text-yellow-400" /> Pending Approvals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-white/10">
                        {bookings.filter(b => b.status === "pending").map(booking => (
                          <div key={booking.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">{booking.amenity?.name}</span>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white font-semibold mt-1">
                                <span>{formatDateTime(booking.start_time)} – {formatDateTime(booking.end_time)}</span>
                              </div>
                              <div className="text-xs text-slate-400 font-mono mt-1">
                                Resident: {booking.resident?.name} ({booking.resident?.email})
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                              <Button 
                                size="sm" 
                                className="flex-1 sm:flex-none bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 text-xs font-bold uppercase tracking-wider gap-1 h-8"
                                onClick={() => handleStatusUpdate(booking.id, "approved")}
                              >
                                <Check className="w-4 h-4" /> Approve
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1 sm:flex-none bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 text-xs font-bold uppercase tracking-wider gap-1 h-8"
                                onClick={() => handleStatusUpdate(booking.id, "rejected")}
                              >
                                <X className="w-4 h-4" /> Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Bookings Ledger */}
                <Card className="glass-card">
                  <CardHeader className="py-4">
                    <CardTitle className="text-base font-bold text-white uppercase tracking-wider">Booking Schedule & History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-slate-300">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-slate-400 font-bold">
                            <th className="p-4">Facility</th>
                            <th className="p-4">Resident</th>
                            <th className="p-4">Time Slot</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                          {bookings.map(booking => (
                            <tr key={booking.id} className="hover:bg-white/5">
                              <td className="p-4 font-bold text-white">{booking.amenity?.name}</td>
                              <td className="p-4 font-mono text-xs">{booking.resident?.name}</td>
                              <td className="p-4 text-xs font-semibold">{formatDateTime(booking.start_time)} – {formatDateTime(booking.end_time)}</td>
                              <td className="p-4">{getStatusBadge(booking.status)}</td>
                              <td className="p-4 text-right">
                                {booking.status === "approved" && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider h-8"
                                    onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* RESIDENT WORKFLOW LIST VIEW */
              <div className="space-y-4 max-w-4xl">
                {bookings.map(booking => (
                  <Card key={booking.id} className="glass-card">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-white uppercase tracking-wide">{booking.amenity?.name}</span>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="text-sm font-semibold text-slate-300 mt-2">
                          {formatDateTime(booking.start_time)} – {formatDateTime(booking.end_time)}
                        </div>
                        {booking.amenity?.rules && (
                          <p className="text-xs text-slate-500 font-light mt-1">Rules: {booking.amenity.rules}</p>
                        )}
                      </div>

                      {(booking.status === "pending" || booking.status === "approved") && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full sm:w-auto bg-red-500/5 hover:bg-red-500/10 border-red-500/30 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-widest h-8"
                          onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ================= MODAL: ADD AMENITY ================= */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-card max-w-md w-full p-6 space-y-4 border border-white/10 rounded-xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="font-bold text-white text-lg uppercase tracking-wide">Add New Amenity</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setShowAddModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {addError && (
                <div className="p-3 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-xs">{addError}</div>
              )}

              <form onSubmit={handleAddAmenity} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Facility Name</Label>
                  <Input 
                    id="name" 
                    required 
                    placeholder="e.g. Clubhouse, Tennis Court" 
                    value={amenityForm.name} 
                    onChange={e => setAmenityForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Provide details about the space, amenities inside, capacity, etc." 
                    value={amenityForm.description} 
                    onChange={e => setAmenityForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rules">Rules / Policy Guidelines (Optional)</Label>
                  <Input 
                    id="rules" 
                    placeholder="e.g. Operating Hours: 6AM-9PM, Max 2 Hours Booking Limit" 
                    value={amenityForm.rules} 
                    onChange={e => setAmenityForm(prev => ({ ...prev, rules: e.target.value }))}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Checkbox 
                    id="booking_required" 
                    checked={amenityForm.booking_required} 
                    onCheckedChange={val => setAmenityForm(prev => ({ ...prev, booking_required: !!val }))}
                    className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                  />
                  <Label htmlFor="booking_required" className="text-slate-300 font-normal">Requires Resident Booking</Label>
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <Button type="button" variant="outline" className="flex-1 glass text-slate-300" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={adding} className="flex-1 font-bold tracking-wider uppercase bg-primary text-black hover:bg-primary/95 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    {adding ? "Saving..." : "Create Facility"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: BOOK SLOT ================= */}
        {showBookModal && selectedAmenity && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-card max-w-md w-full p-6 space-y-4 border border-white/10 rounded-xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base uppercase tracking-wide">Book Slot: {selectedAmenity.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-0.5">REQUEST SCHEDULING</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => {
                  setShowBookModal(false)
                  setSelectedAmenity(null)
                  setBookError("")
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {bookError && (
                <div className="p-3 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-semibold leading-relaxed flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{bookError}</span>
                </div>
              )}

              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Date & Time</Label>
                  <Input 
                    id="start_time" 
                    type="datetime-local" 
                    required 
                    value={bookingForm.start_time} 
                    onChange={e => setBookingForm(prev => ({ ...prev, start_time: e.target.value }))}
                    className="bg-black/20 border-white/10 text-white focus-visible:ring-primary [color-scheme:dark]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Date & Time</Label>
                  <Input 
                    id="end_time" 
                    type="datetime-local" 
                    required 
                    value={bookingForm.end_time} 
                    onChange={e => setBookingForm(prev => ({ ...prev, end_time: e.target.value }))}
                    className="bg-black/20 border-white/10 text-white focus-visible:ring-primary [color-scheme:dark]"
                  />
                </div>

                {selectedAmenity.rules && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-yellow-400 tracking-wider">Reminder</span>
                      <p className="text-[11px] text-slate-400 leading-normal font-light">{selectedAmenity.rules}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <Button type="button" variant="outline" className="flex-1 glass text-slate-300" onClick={() => {
                    setShowBookModal(false)
                    setSelectedAmenity(null)
                    setBookError("")
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={booking} className="flex-1 font-bold tracking-wider uppercase bg-primary text-black hover:bg-primary/95 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    {booking ? "Scheduling..." : "Request Booking"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

export default AmenityDashboard
