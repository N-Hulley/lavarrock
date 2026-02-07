/**
 * Custom logger with namespace support and backend sync capability
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private listeners: Set<(entry: LogEntry) => void> = new Set();
  private syncQueue: LogEntry[] = [];
  private syncInterval: number | null = null;

  constructor() {
    // Load logs from localStorage
    this.loadLogs();
    
    // Start sync interval (every 5 seconds)
    this.startSync();
  }

  /**
   * Create a namespaced logger
   */
  namespace(namespace: string) {
    return {
      debug: (message: string, data?: any) => this.log("debug", namespace, message, data),
      info: (message: string, data?: any) => this.log("info", namespace, message, data),
      warn: (message: string, data?: any) => this.log("warn", namespace, message, data),
      error: (message: string, data?: any, error?: Error) => {
        const stack = error?.stack;
        this.log("error", namespace, message, data, stack);
      },
    };
  }

  /**
   * Log a message
   */
  private log(level: LogLevel, namespace: string, message: string, data?: any, stack?: string) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      namespace,
      message,
      data,
      stack,
    };

    this.logs.push(entry);
    this.syncQueue.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(entry));

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === "debug" ? "log" : level;
      const prefix = `[${namespace}]`;
      console[consoleMethod](prefix, message, data || "");
      if (stack) console.error(stack);
    }

    // Save to localStorage
    this.saveLogs();
  }

  /**
   * Get all logs
   */
  getLogs(filter?: { namespace?: string; level?: LogLevel; search?: string }): LogEntry[] {
    let filtered = this.logs;

    if (filter?.namespace) {
      filtered = filtered.filter((log) => log.namespace === filter.namespace);
    }

    if (filter?.level) {
      filtered = filtered.filter((log) => log.level === filter.level);
    }

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(search) ||
          log.namespace.toLowerCase().includes(search) ||
          JSON.stringify(log.data || "").toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  /**
   * Get unique namespaces
   */
  getNamespaces(): string[] {
    const namespaces = new Set(this.logs.map((log) => log.namespace));
    return Array.from(namespaces).sort();
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
    this.saveLogs();
    this.listeners.forEach((listener) => listener({} as any));
  }

  /**
   * Subscribe to log updates
   */
  subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Save logs to localStorage
   */
  private saveLogs() {
    try {
      // Only save last 100 logs to localStorage to avoid quota issues
      const recentLogs = this.logs.slice(-100);
      localStorage.setItem("lavarrock_logs", JSON.stringify(recentLogs));
    } catch (error) {
      console.error("Failed to save logs to localStorage:", error);
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadLogs() {
    try {
      const stored = localStorage.getItem("lavarrock_logs");
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load logs from localStorage:", error);
    }
  }

  /**
   * Start sync interval
   */
  private startSync() {
    // TODO: Implement backend sync
    this.syncInterval = window.setInterval(() => {
      if (this.syncQueue.length > 0) {
        this.syncToBackend();
      }
    }, 5000);
  }

  /**
   * Sync logs to backend
   */
  private async syncToBackend() {
    if (this.syncQueue.length === 0) return;

    const logsToSync = [...this.syncQueue];
    this.syncQueue = [];

    try {
      // TODO: Replace with actual backend endpoint
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ logs: logsToSync }),
      // });

      // For now, just log to console
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Logger] Would sync ${logsToSync.length} logs to backend`);
      }
    } catch (error) {
      // Put logs back in queue if sync fails
      this.syncQueue.unshift(...logsToSync);
      console.error("Failed to sync logs to backend:", error);
    }
  }

  /**
   * Stop sync interval
   */
  destroy() {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Pre-create common namespaces
export const appLogger = logger.namespace("app");
export const pluginLogger = logger.namespace("plugin");
export const uiLogger = logger.namespace("ui");
export const apiLogger = logger.namespace("api");
