type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    }

    // In production, only log errors and warnings
    if (!this.isDevelopment && (level === "info" || level === "debug")) {
      return
    }

    const prefix = `[${level.toUpperCase()}]`
    const output = data ? `${prefix} ${message}` : `${prefix} ${message}`

    switch (level) {
      case "error":
        console.error(output, data || "")
        break
      case "warn":
        console.warn(output, data || "")
        break
      case "info":
      case "debug":
        console.log(output, data || "")
        break
    }
  }

  info(message: string, data?: any) {
    this.log("info", message, data)
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data)
  }

  error(message: string, data?: any) {
    this.log("error", message, data)
  }

  debug(message: string, data?: any) {
    this.log("debug", message, data)
  }
}

export const logger = new Logger()
