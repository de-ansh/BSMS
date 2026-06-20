import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, User, Phone, Calendar, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"

const VisitorForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    visitor_name: "",
    phone: "",
    purpose: "",
    expected_arrival: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await api.visitors.create({
        ...formData,
        expected_arrival: formData.expected_arrival || null,
      })
      navigate("/visitors")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save visitor")
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="glass text-slate-300 hover:text-white" onClick={() => navigate("/visitors")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide uppercase">New Visitor</h1>
            <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-light">Register or pre-approve a guest</p>
          </div>
        </div>

        <Card className="glass-card">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="visitor_name" className="text-slate-300 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                    <User className="h-3 w-3" /> Full Name
                  </Label>
                  <Input
                    id="visitor_name"
                    name="visitor_name"
                    required
                    placeholder="Enter visitor's full name"
                    value={formData.visitor_name}
                    onChange={handleChange}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                    <Phone className="h-3 w-3" /> Phone Number (Optional)
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose" className="text-slate-300 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                    <ClipboardList className="h-3 w-3" /> Purpose of Visit
                  </Label>
                  <Input
                    id="purpose"
                    name="purpose"
                    placeholder="e.g., Delivery, Guest, Maintenance"
                    value={formData.purpose}
                    onChange={handleChange}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_arrival" className="text-slate-300 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Expected Date
                  </Label>
                  <Input
                    id="expected_arrival"
                    name="expected_arrival"
                    type="date"
                    value={formData.expected_arrival}
                    onChange={handleChange}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 glass hover:border-white/30 text-slate-300"
                  onClick={() => navigate("/visitors")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 font-bold tracking-widest uppercase bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] border border-primary transition-all"
                >
                  {loading ? "Saving..." : "Save Visitor"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

export default VisitorForm
