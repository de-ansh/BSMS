import { forwardRef, createContext, useContext, useState, useRef, useEffect, cloneElement } from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null)

const useDropdownMenuContext = () => {
  const ctx = useContext(DropdownMenuContext)
  if (!ctx) throw new Error("DropdownMenu components must be used within a DropdownMenu")
  return ctx
}

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block" ref={ref}>{children}</div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild, onClick, children, ...props }, ref) => {
  const { setOpen, open } = useDropdownMenuContext()
  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLSpanElement>) => {
    setOpen(!open)
    onClick?.(e as React.MouseEvent<HTMLButtonElement>)
  }

  if (asChild && children) {
    const child = children as React.ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>
    return cloneElement(child, {
      onClick: handleClick as React.MouseEventHandler<HTMLElement>,
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn("cursor-pointer", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end" | "center"
}

const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "end", ...props }, ref) => {
    const { open } = useDropdownMenuContext()
    if (!open) return null
    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 shadow-md",
          align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
          className
        )}
        {...props}
      />
    )
  }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, onClick, ...props }, ref) => {
  const { setOpen } = useDropdownMenuContext()
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        inset && "pl-8",
        className
      )}
      onClick={(e) => { setOpen(false); onClick?.(e) }}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
