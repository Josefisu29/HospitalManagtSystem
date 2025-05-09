import { honeypot, vpnDetection, antiPhishing } from "./security.js";
import securityLogger from "./securityLogger.js";

// Security Middleware
class SecurityMiddleware {
  constructor() {
    this.setupSecurity();
    this.setupAdditionalChecks();
  }

  // Setup all security measures
  setupSecurity() {
    // Setup form protection
    this.setupFormProtection();

    // Setup link protection
    this.setupLinkProtection();

    // Setup VPN detection
    this.setupVPNDetection();

    // Setup phishing report
    antiPhishing.setupPhishingReport();

    // Setup additional security measures
    this.setupAdditionalChecks();
  }

  // Setup additional security checks
  setupAdditionalChecks() {
    // Monitor for suspicious activity
    this.monitorSuspiciousActivity();

    // Check for browser extensions
    this.checkBrowserExtensions();

    // Monitor for XSS attempts
    this.monitorXSSAttempts();

    // Check for dev tools usage
    this.monitorDevTools();
  }

  // Monitor for suspicious activity
  monitorSuspiciousActivity() {
    let lastActivity = Date.now();
    const suspiciousPatterns = [
      "eval(",
      "setTimeout(",
      "setInterval(",
      "document.write(",
      "innerHTML",
      "outerHTML",
    ];

    // Monitor DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          const suspicious = suspiciousPatterns.some((pattern) =>
            mutation.target.innerHTML?.includes(pattern)
          );
          if (suspicious) {
            securityLogger.logEvent(
              "suspicious_activity",
              {
                type: "dom_mutation",
                target: mutation.target.tagName,
                pattern: suspiciousPatterns.find((p) =>
                  mutation.target.innerHTML?.includes(p)
                ),
              },
              "warning"
            );
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Monitor user activity
    document.addEventListener("click", () => {
      const now = Date.now();
      if (now - lastActivity < 100) {
        // Multiple clicks within 100ms
        securityLogger.logEvent(
          "suspicious_activity",
          {
            type: "rapid_clicks",
            timeBetweenClicks: now - lastActivity,
          },
          "warning"
        );
      }
      lastActivity = now;
    });
  }

  // Check for browser extensions
  checkBrowserExtensions() {
    const knownExtensions = ["ublock", "adblock", "ghostery", "noscript"];

    // Check for extension presence
    knownExtensions.forEach((extension) => {
      if (document.querySelector(`[data-${extension}]`)) {
        securityLogger.logEvent(
          "extension_detected",
          {
            extension,
            url: window.location.href,
          },
          "info"
        );
      }
    });
  }

  // Monitor for XSS attempts
  monitorXSSAttempts() {
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (
        typeof value === "string" &&
        (value.includes("<script>") ||
          value.includes("javascript:") ||
          value.includes("onerror=") ||
          value.includes("onload="))
      ) {
        securityLogger.logEvent(
          "xss_attempt",
          {
            element: this.tagName,
            attribute: name,
            value: value,
          },
          "critical"
        );
        return;
      }
      return originalSetAttribute.call(this, name, value);
    };
  }

  // Monitor dev tools usage
  monitorDevTools() {
    let devToolsOpen = false;

    // Check for dev tools
    const checkDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          securityLogger.logEvent(
            "dev_tools_opened",
            {
              url: window.location.href,
              timestamp: new Date().toISOString(),
            },
            "warning"
          );
        }
      } else {
        devToolsOpen = false;
      }
    };

    // Monitor window size changes
    window.addEventListener("resize", checkDevTools);
    setInterval(checkDevTools, 1000);
  }

  // Protect forms from bots
  setupFormProtection() {
    document.querySelectorAll("form").forEach((form) => {
      // Add honeypot fields
      this.addHoneypotFields(form);

      // Add form submission protection
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Check for bot activity
        if (honeypot.checkBotActivity()) {
          securityLogger.logEvent(
            "bot_activity",
            {
              formId: form.id,
              url: window.location.href,
            },
            "warning"
          );
          this.showWarning("Suspicious activity detected. Please try again.");
          return;
        }

        // Check honeypot fields
        const formData = new FormData(form);
        if (honeypot.checkHoneypotFields(formData)) {
          securityLogger.logEvent(
            "honeypot_triggered",
            {
              formId: form.id,
              fields: Array.from(formData.entries()),
            },
            "warning"
          );
          this.showWarning("Invalid form submission detected.");
          return;
        }

        // Continue with form submission
        form.submit();
      });
    });
  }

  // Add honeypot fields to forms
  addHoneypotFields(form) {
    const fields = ["website", "company", "phone"];
    fields.forEach((field) => {
      const input = document.createElement("input");
      input.type = "text";
      input.name = field;
      input.style.display = "none";
      input.setAttribute("tabindex", "-1");
      input.setAttribute("autocomplete", "off");
      form.appendChild(input);
    });
  }

  // Protect links from phishing
  setupLinkProtection() {
    document.addEventListener("click", async (e) => {
      const link = e.target.closest("a");
      if (link) {
        e.preventDefault();

        // Check URL
        const isSafe = await antiPhishing.checkURL(link.href);
        if (isSafe) {
          window.location.href = link.href;
        } else {
          securityLogger.logEvent(
            "unsafe_link",
            {
              url: link.href,
              text: link.textContent,
            },
            "warning"
          );
          this.showWarning(
            "This link may be unsafe. Please proceed with caution."
          );
        }
      }
    });
  }

  // Setup VPN detection
  async setupVPNDetection() {
    // Check for VPN on page load
    const isVPN = await vpnDetection.checkVPN();
    if (isVPN) {
      securityLogger.logEvent(
        "vpn_detected",
        {
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
        "warning"
      );
      this.showWarning(
        "VPN detected. Additional verification may be required."
      );
    }
  }

  // Show warning message
  showWarning(message, severity = "warning") {
    const warning = document.createElement("div");
    warning.className = `security-warning ${severity}`;
    warning.innerHTML = `
      <div class="warning-content">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
      </div>
      <button class="close-warning">&times;</button>
    `;

    document.body.appendChild(warning);

    // Add close button functionality
    warning.querySelector(".close-warning").addEventListener("click", () => {
      warning.remove();
    });

    // Remove warning after 5 seconds
    setTimeout(() => {
      warning.classList.add("fade-out");
      setTimeout(() => warning.remove(), 300);
    }, 5000);
  }
}

// Initialize security middleware
const securityMiddleware = new SecurityMiddleware();

export default securityMiddleware;
