import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, User, ClipboardList, PenTool, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

const ComplaintForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category) {
      setError("Please select a category")
      return
    }
    setError("")
    setLoading(true)

    try {
      await api.complaints.create(formData)
      navigate("/helpdesk")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit ticket")
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (val: string) => {
    setFormData(prev => ({ ...prev, category: val }))
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="glass text-slate-300 hover:text-white" onClick={() => navigate("/helpdesk")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide uppercase">New Helpdesk Ticket</h1>
            <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-light">Submit a complaint or maintenance request</p>
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
                  <Label htmlFor="category" className="text-slate-300 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                    <ClipboardList className="h-3 w-3" /> Category
                  </Label>
                  <Select value={formData.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary transition-all">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-300 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                    <PenTool className="h-3 w-3" /> Title / Subject
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    placeholder="Briefly name the issue (e.g. Bathroom Leak, Hallway light broken)"
                    value={formData.title}
                    onChange={handleChange}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-300 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                    <Wrench className="h-3 w-3" /> Detailed Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    rows={5}
                    placeholder="Provide details about the issue, including location and urgency."
                    value={formData.description}
                    onChange={handleChange}
                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 glass hover:border-white/30 text-slate-300 text-xs uppercase tracking-widest font-bold"
                  onClick={() => navigate("/helpdesk")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 font-bold tracking-widest uppercase bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] border border-primary transition-all text-xs"
                >
                  {loading ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

export default ComplaintForm
