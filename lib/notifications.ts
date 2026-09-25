import { toast as sonnerToast, type ExternalToast } from "sonner"

export interface NotificationOptions extends ExternalToast {
  description?: string
  actionLabel?: string
  onAction?: () => void
}

const activeToasts = new Map<string, number>()

function deduplicateToast(key: string): boolean {
  const now = Date.now()
  const lastShown = activeToasts.get(key)
  if (lastShown && now - lastShown < 3000) {
    return true // duplicate within 3s
  }
  activeToasts.set(key, now)
  return false
}

export const notify = {
  success: (message: string, options?: NotificationOptions) => {
    if (deduplicateToast(`success:${message}`)) return
    return sonnerToast.success(message, {
      duration: 4000,
      description: options?.description,
      action: options?.actionLabel && options?.onAction ? {
        label: options.actionLabel,
        onClick: options.onAction,
      } : undefined,
      ...options,
    })
  },

  error: (message: string, options?: NotificationOptions) => {
    if (deduplicateToast(`error:${message}`)) return
    return sonnerToast.error(message, {
      duration: 6000,
      description: options?.description,
      action: options?.actionLabel && options?.onAction ? {
        label: options.actionLabel,
        onClick: options.onAction,
      } : undefined,
      ...options,
    })
  },

  warning: (message: string, options?: NotificationOptions) => {
    if (deduplicateToast(`warning:${message}`)) return
    return sonnerToast.warning(message, {
      duration: 5000,
      description: options?.description,
      action: options?.actionLabel && options?.onAction ? {
        label: options.actionLabel,
        onClick: options.onAction,
      } : undefined,
      ...options,
    })
  },

  info: (message: string, options?: NotificationOptions) => {
    if (deduplicateToast(`info:${message}`)) return
    return sonnerToast.info(message, {
      duration: 4000,
      description: options?.description,
      action: options?.actionLabel && options?.onAction ? {
        label: options.actionLabel,
        onClick: options.onAction,
      } : undefined,
      ...options,
    })
  },

  loading: (message: string, options?: NotificationOptions) => {
    return sonnerToast.loading(message, {
      ...options,
    })
  },

  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id)
  },
}

export function handleApiError(error: any, fallbackMessage: string = "An unexpected error occurred."): string {
  let message = fallbackMessage

  if (error?.response) {
    const status = error.response.status
    const data = error.response.data

    if (status === 401) {
      message = "Session expired. Please sign in again."
    } else if (status === 403) {
      message = "You do not have permission to perform this action."
    } else if (status === 404) {
      message = "The requested resource was not found."
    } else if (status === 422) {
      if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0]
        if (firstKey && data.errors[firstKey]?.[0]) {
          message = data.errors[firstKey][0]
        } else {
          message = data.message || "Please verify your input and try again."
        }
      } else {
        message = data?.message || "Please verify your input and try again."
      }
    } else if (status === 429) {
      message = "Too many requests. Please slow down and try again."
    } else if (status >= 500) {
      message = "Something went wrong on the server. Please try again."
    } else if (data?.message) {
      message = data.message
    }
  } else if (error?.request) {
    message = "Unable to connect to the server. Please check your internet connection."
  } else if (error?.message) {
    message = error.message
  }

  notify.error(message)
  return message
}

export { sonnerToast as toast }
