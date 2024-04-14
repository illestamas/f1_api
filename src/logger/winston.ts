import { createLogger, transports, format } from "winston"

export const logger = createLogger({
  level: process.env.LOG_LEVEL,
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf((info) => {
      return `[${info.level.toUpperCase()}][${
        info.timestamp
      }]: ${info.message.toString()}`
    }),
    format.splat()
  ),
}).add(
  new transports.Console({
    level: process.env.LOG_LEVEL,
  })
)
