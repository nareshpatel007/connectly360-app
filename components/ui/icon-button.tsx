"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  icon: React.ReactNode
  label?: string
  tooltip?: string
  tooltipSide?: "top" | "right" | "bottom" | "left"
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      tooltip,
      tooltipSide = "top",
      className,
      size = "icon",
      variant = "ghost",
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const effectiveLabel = label || tooltip || ariaLabel || "Action"

    const btn = (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("shrink-0", className)}
        aria-label={effectiveLabel}
        {...props}
      >
        {icon}
      </Button>
    )

    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return btn
  }
)

IconButton.displayName = "IconButton"
