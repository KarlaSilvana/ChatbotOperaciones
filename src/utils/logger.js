/**
 * Utilidad de logging
 * Registra eventos importante en la consola
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors.cyan}[${timestamp}] INFO:${colors.reset}`, message);
    if (data) console.log(data);
  },

  error: (message, error = null) => {
    const timestamp = new Date().toLocaleTimeString();
    console.error(`${colors.red}[${timestamp}] ERROR:${colors.reset}`, message);
    if (error) console.error(error);
  },

  success: (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors.green}[${timestamp}] SUCCESS:${colors.reset}`, message);
    if (data) console.log(data);
  },

  warning: (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    console.warn(`${colors.yellow}[${timestamp}] WARN:${colors.reset}`, message);
    if (data) console.log(data);
  },

  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`${colors.blue}[${timestamp}] DEBUG:${colors.reset}`, message);
      if (data) console.log(data);
    }
  }
};

module.exports = logger;
