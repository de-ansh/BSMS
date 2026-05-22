import { forwardRef } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

const Breadcrumb = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <nav ref={ref} className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)} {...props} />
  )
)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbItem = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("inline-flex items-center gap-1", className)} {...props} />
  )
)
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn("cursor-pointer font-medium hover:text-foreground transition-colors bg-transparent border-0 p-0 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbSeparator = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("text-muted-foreground", className)} {...props}>
      <ChevronRight className="h-4 w-4" />
    </span>
  )
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator }
