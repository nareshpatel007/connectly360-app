"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#EAF7F2] group-[.toaster]:text-[#0B2E1E] group-[.toaster]:border-[#A8E0D0] group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl font-sans group-[.toaster]:p-3.5 group-[.toaster]:font-bold text-xs",
          description: "group-[.toast]:text-[#2C6F66] text-xs mt-0.5 font-medium",
          actionButton:
            "group-[.toast]:bg-[#378179] group-[.toast]:text-white font-bold text-xs rounded-xl px-3 py-1.5",
          cancelButton:
            "group-[.toast]:bg-emerald-100 group-[.toast]:text-emerald-900 font-medium text-xs rounded-xl px-3 py-1.5",
          closeButton:
            "group-[.toast]:bg-[#CBEFE3] group-[.toast]:text-[#0B2E1E] group-[.toast]:border-[#A8E0D0] group-[.toast]:hover:bg-[#B5E7D8]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
