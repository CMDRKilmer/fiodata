const fs = require('fs');
const path = require('path');

function getProjectRoot() {
  return path.resolve(__dirname, '..', '..');
}

function getDataDir() {
  const envDataDir = process.env.DATA_DIR;
  if (envDataDir) {
    return path.isAbsolute(envDataDir) ? envDataDir : path.resolve(getProjectRoot(), envDataDir);
  }
  return path.resolve(getProjectRoot(), 'data');
}

function getLogDir() {
  const envLogDir = process.env.LOG_DIR;
  if (envLogDir) {
    return path.isAbsolute(envLogDir) ? envLogDir : path.resolve(getProjectRoot(), envLogDir);
  }
  return path.resolve(getProjectRoot(), 'logs');
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getLogFilePath() {
  const logDir = ensureDirectoryExists(getLogDir());
  const date = new Date().toISOString().split('T')[0];
  return path.join(logDir, `fio_fetch_${date}.log`);
}

function formatTimestamp() {
  return new Date().toISOString();
}

function formatLogMessage(level, message, metadata = {}) {
  const timestamp = formatTimestamp();
  let logLine = `${timestamp} [${level.toUpperCase()}] ${message}`;
  if (Object.keys(metadata).length > 0) {
    logLine += ` ${JSON.stringify(metadata)}`;
  }
  return logLine;
}

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFilePath = getLogFilePath();
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };

    ensureDirectoryExists(getLogDir());
    ensureDirectoryExists(getDataDir());
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  writeToFile(message) {
    try {
      fs.appendFileSync(this.logFilePath, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  log(level, message, metadata = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = formatLogMessage(level, message, metadata);

    if (level === 'error' || level === 'warn') {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }

    this.writeToFile(formattedMessage);
  }

  error(message, metadata) { this.log('error', message, metadata); }
  warn(message, metadata) { this.log('warn', message, metadata); }
  info(message, metadata) { this.log('info', message, metadata); }
  debug(message, metadata) { this.log('debug', message, metadata); }
}

const logger = new Logger();

module.exports = logger;
module.exports.Logger = Logger;
module.exports.getDataDir = getDataDir;
module.exports.getLogDir = getLogDir;
module.exports.getProjectRoot = getProjectRoot;
module.exports.ensureDirectoryExists = ensureDirectoryExists;
