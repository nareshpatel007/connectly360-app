"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

export interface SuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  primaryActionText?: string
  secondaryActionText?: string
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
}

export function SuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  primaryActionText = "Done",
  secondaryActionText,
  onPrimaryAction,
  onSecondaryAction,
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <DialogHeader className="flex flex-col items-center text-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="size-7" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          {secondaryActionText && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onSecondaryAction?.()
                onOpenChange(false)
              }}
            >
              {secondaryActionText}
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              onPrimaryAction?.()
              onOpenChange(false)
            }}
          >
            {primaryActionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export interface WarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  actionText?: string
  cancelText?: string
  onAction?: () => void
}

export function WarningDialog({
  open,
  onOpenChange,
  title,
  description,
  actionText = "Continue",
  cancelText = "Cancel",
  onAction,
}: WarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <DialogHeader className="flex flex-col items-center text-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <AlertTriangle className="size-7" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant="warning"
            size="sm"
            onClick={() => {
              onAction?.()
              onOpenChange(false)
            }}
          >
            {actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export interface ErrorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  actionText?: string
  onAction?: () => void
}

export function ErrorDialog({
  open,
  onOpenChange,
  title,
  description,
  actionText = "Close",
  onAction,
}: ErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <DialogHeader className="flex flex-col items-center text-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <XCircle className="size-7" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onAction?.()
              onOpenChange(false)
            }}
          >
            {actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
