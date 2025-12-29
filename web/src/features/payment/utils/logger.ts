/**
 * Payment Logger Utility
 * Conditional logging that only outputs in development mode
 *
 * KISS: Simple wrapper around console methods
 * Production: Silent
 * Development: Full logging
 */

const isDev = import.meta.env.DEV

export const paymentLogger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args)
  },

  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args)
  },

  error: (...args: unknown[]) => {
    // Errors always logged for debugging, but could be sent to error tracking service
    if (isDev) console.error(...args)
  },

  /** Log only in development, with a prefix */
  debug: (prefix: string, ...args: unknown[]) => {
    if (isDev) console.log(`[${prefix}]`, ...args)
  },
}
