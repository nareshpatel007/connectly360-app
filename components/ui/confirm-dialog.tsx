"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, Trash2 } from "lucide-react"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "default" | "warning" | "primary"
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true)
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const iconMap = {
    destructive: <Trash2 className="size-5 text-red-600" />,
    warning: <AlertTriangle className="size-5 text-amber-500" />,
    default: <Info className="size-5 text-[#35877D]" />,
    primary: <Info className="size-5 text-[#35877D]" />,
  }

  const buttonVariant =
    variant === "destructive"
      ? "destructive"
      : variant === "warning"
      ? "warning"
      : "default"

  const isLoading = loading || isSubmitting

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <AlertDialogHeader className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            {iconMap[variant]}
          </div>
          <div>
            <AlertDialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </AlertDialogTitle>
            {description && (
              <AlertDialogDescription className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </AlertDialogDescription>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={buttonVariant}
            size="sm"
            loading={isLoading}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
