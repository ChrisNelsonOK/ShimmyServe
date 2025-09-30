import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export function formatTimestamp(timestamp: number | Date) {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isElectron() {
  return typeof window !== 'undefined' && window.electronAPI
}

export function getElectronAPI() {
  if (!isElectron()) {
    throw new Error('Electron API not available')
  }
  return window.electronAPI
}

export function validateUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validatePort(port: string | number) {
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port
  return portNum >= 1 && portNum <= 65535
}

export function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase()
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
    document.body.removeChild(textArea)
    return Promise.resolve()
  }
}

export function downloadFile(data: string, filename: string, type = 'text/plain') {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function parseLogLevel(level: string): 'error' | 'warn' | 'info' | 'debug' {
  const normalized = level.toLowerCase()
  if (['error', 'err'].includes(normalized)) return 'error'
  if (['warn', 'warning'].includes(normalized)) return 'warn'
  if (['info', 'information'].includes(normalized)) return 'info'
  return 'debug'
}

export function getLogLevelColor(level: string) {
  switch (parseLogLevel(level)) {
    case 'error':
      return 'text-red-400'
    case 'warn':
      return 'text-yellow-400'
    case 'info':
      return 'text-blue-400'
    case 'debug':
      return 'text-gray-400'
    default:
      return 'text-foreground'
  }
}

export function formatModelName(modelPath: string) {
  const filename = modelPath.split('/').pop() || modelPath
  return filename.replace(/\.(gguf|bin|safetensors)$/i, '')
}

export function getModelSize(modelPath: string) {
  // Extract size from common model naming patterns
  const sizeMatch = modelPath.match(/(\d+(?:\.\d+)?)[bB]/i)
  if (sizeMatch) {
    const size = parseFloat(sizeMatch[1])
    return size >= 1 ? `${size}B` : `${size * 1000}M`
  }
  return 'Unknown'
}

export function isValidModelFile(filename: string) {
  return /\.(gguf|bin|safetensors)$/i.test(filename)
}
