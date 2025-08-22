"use client"

import * as React from "react"
import { HelpCircle } from "lucide-react"
import { FormLabel } from "@/components/ui/form"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface FormLabelWithTooltipProps extends React.ComponentProps<typeof FormLabel> {
  tooltip?: string
  tooltipSide?: "top" | "right" | "bottom" | "left"
  showIcon?: boolean
}

const FormLabelWithTooltip = React.forwardRef<
  React.ElementRef<typeof FormLabel>,
  FormLabelWithTooltipProps
>(({ children, tooltip, tooltipSide = "top", showIcon = true, className, ...props }, ref) => {
  if (!tooltip) {
    return (
      <FormLabel ref={ref} className={className} {...props}>
        {children}
      </FormLabel>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-2">
        <FormLabel ref={ref} className={className} {...props}>
          {children}
        </FormLabel>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className={cn(
              "h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors",
              !showIcon && "hidden"
            )} />
          </TooltipTrigger>
          <TooltipContent side={tooltipSide} className="max-w-xs">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
})

FormLabelWithTooltip.displayName = "FormLabelWithTooltip"

export { FormLabelWithTooltip }