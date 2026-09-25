import * as React from "react"
import { notify } from "@/lib/notifications"

export interface ToastProps {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive" | "success" | "warning"
  action?: any
}

function toast({ title, description, variant, ...props }: ToastProps) {
  const message = typeof title === "string" ? title : (title ? String(title) : "Notification")
  const desc = typeof description === "string" ? description : undefined

  if (variant === "destructive") {
    return notify.error(message, { description: desc })
  } else if (variant === "success") {
    return notify.success(message, { description: desc })
  } else if (variant === "warning") {
    return notify.warning(message, { description: desc })
  } else {
    return notify.info(message, { description: desc })
  }
}

function useToast() {
  return {
    toasts: [],
    toast,
    dismiss: (toastId?: string) => notify.dismiss(toastId),
  }
}

export { useToast, toast }
