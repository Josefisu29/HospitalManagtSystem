// Security Logger Implementation
class SecurityLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Maximum number of logs to keep
  }

  // Log security event
  logEvent(type, details, severity = "info") {
    const log = {
      timestamp: new Date().toISOString(),
      type,
      details,
      severity,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId(),
    };

    this.logs.push(log);
    this.trimLogs();
    this.persistLog(log);
    this.notifySecurityTeam(log);
  }

  // Get current session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem("securitySessionId");
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem("securitySessionId", sessionId);
    }
    return sessionId;
  }

  // Generate unique session ID
  generateSessionId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // Trim logs to maximum size
  trimLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  // Persist log to storage
  async persistLog(log) {
    try {
      const logs = JSON.parse(localStorage.getItem("securityLogs") || "[]");
      logs.push(log);
      localStorage.setItem("securityLogs", JSON.stringify(logs));
    } catch (error) {
      console.error("Error persisting security log:", error);
    }
  }

  // Notify security team of critical events
  async notifySecurityTeam(log) {
    if (log.severity === "critical") {
      try {
        // Implementation would send notification to security team
        console.warn("Critical security event:", log);
      } catch (error) {
        console.error("Error notifying security team:", error);
      }
    }
  }

  // Get logs for analysis
  getLogs(filter = {}) {
    return this.logs.filter((log) => {
      return Object.entries(filter).every(([key, value]) => log[key] === value);
    });
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem("securityLogs");
  }
}

// Initialize security logger
const securityLogger = new SecurityLogger();

export default securityLogger;
