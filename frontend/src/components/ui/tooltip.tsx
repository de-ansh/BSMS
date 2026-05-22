import { forwardRef, createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = createContext<TooltipContextValue | null>(null)

const useTooltipContext = () => {
  const ctx = useContext(TooltipContext)
  if (!ctx) throw new Error("Tooltip components must be used within a TooltipProvider")
  return ctx
}

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div
        className="relative inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

const TooltipTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? "span" : "button"
  return (
    <Comp ref={ref} className={cn("cursor-pointer", className)} {...props} />
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { open } = useTooltipContext()
    if (!open) return null
    return (
      <div
        ref={ref}
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs shadow-md animate-in fade-in-0 zoom-in-95",
          "whitespace-nowrap",
          className
        )}
        {...props}
      />
    )
  }
)
TooltipContent.displayName = "TooltipContent"

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }
