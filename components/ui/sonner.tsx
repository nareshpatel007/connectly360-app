"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl font-sans group-[.toaster]:p-3.5 dark:group-[.toaster]:bg-slate-900 dark:group-[.toaster]:text-slate-100 dark:group-[.toaster]:border-slate-800",
          description: "group-[.toast]:text-slate-500 text-xs dark:group-[.toast]:text-slate-400 mt-0.5",
          actionButton:
            "group-[.toast]:bg-[#35877D] group-[.toast]:text-white font-medium text-xs rounded-lg px-3 py-1.5",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-700 font-medium text-xs rounded-lg px-3 py-1.5 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:text-slate-300",
          closeButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 group-[.toast]:border-slate-200 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:border-slate-700",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
