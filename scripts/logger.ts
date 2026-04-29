import winston from "winston";

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`,
  ),
);

export function createLogger(
  extraTransports: winston.transport[] = [],
): winston.Logger {
  return winston.createLogger({
    level: "info",
    format: baseFormat,
    transports: [new winston.transports.Console(), ...extraTransports],
  });
}
