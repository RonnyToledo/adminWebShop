"use client"

import { Card } from "@/components/ui/card"
import { ArrowRight, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"



export function QuickActionCard({
  title,
  actionLabel,
  actionHref = "#",
  external,
  icon,
  className,
}) {
  return (
    <Card
      className={cn(
        "p-4 transition-all duration-300 hover:border-primary/40 hover:bg-secondary/50 cursor-pointer group",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">{title}</h4>
          {actionHref && external && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{actionHref}</p>
          )}
        </div>
        <div className="flex items-center shrink-0">
          {actionLabel && (
            <span className="text-xs text-primary mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {actionLabel}
            </span>
          )}
          {external ? (
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          ) : (
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          )}
        </div>
      </div>
    </Card>
  )
}
