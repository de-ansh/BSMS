import { forwardRef, createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  labelMap: Record<string, string>
  registerLabel: (value: string, label: string) => void
  disabled?: boolean
}

const SelectContext = createContext<SelectContextValue | null>(null)

const useSelectContext = () => {
  const ctx = useContext(SelectContext)
  if (!ctx) throw new Error("Select components must be used within a Select")
  return ctx
}

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}

const Select = ({ value, defaultValue, onValueChange, children, disabled }: SelectProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue || "")
  const [open, setOpen] = useState(false)
  const [labelMap, setLabelMap] = useState<Record<string, string>>({})
  const ref = useRef<HTMLDivElement>(null)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const registerLabel = useCallback((val: string, label: string) => {
    setLabelMap(prev => ({ ...prev, [val]: label }))
  }, [])

  const handleValueChange = (newValue: string) => {
    if (!isControlled) setInternalValue(newValue)
    onValueChange?.(newValue)
    setOpen(false)
  }

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
    <SelectContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, open, setOpen, labelMap, registerLabel, disabled }}>
      <div className="relative" ref={ref}>{children}</div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, disabled: triggerDisabled, ...props }, ref) => {
    const { setOpen, open, disabled: contextDisabled } = useSelectContext()
    const isDisabled = triggerDisabled || contextDisabled
    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => !isDisabled && setOpen(!open)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string
}

const SelectValue = forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder = "Select...", ...props }, ref) => {
    const { value, labelMap } = useSelectContext()
    const display = labelMap[value] || value || placeholder
    return (
      <span ref={ref} className={cn("text-sm truncate", className)} {...props}>
        {display}
      </span>
    )
  }
)
SelectValue.displayName = "SelectValue"

const SelectContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { open } = useSelectContext()
    if (!open) return null
    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 shadow-md",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SelectContent.displayName = "SelectContent"

const SelectItem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ className, children, value: itemValue, ...props }, ref) => {
    const { value, onValueChange, registerLabel } = useSelectContext()
    const isSelected = value === itemValue
    const label = typeof children === "string" ? children : itemValue
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const registered = useRef(false)
    if (!registered.current) {
      registerLabel(itemValue, label)
      registered.current = true
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent",
          className
        )}
        onClick={() => onValueChange(itemValue)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
