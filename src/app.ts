import express from "express"
import dotenv from "dotenv"
import { logger } from "./logger/winston"

import driverRouter from "./utils/routes/driver.routes"

dotenv.config()

const app = express()

app.use("/api/drivers", driverRouter)

app.listen(process.env.PORT, () => {
  assertEnvironmentVariablesLoaded()

  logger.info(`Server is running at ${process.env.HOST}:${process.env.PORT}`)
})

function assertEnvironmentVariablesLoaded() {
  const variables = ["HOST", "PORT"]

  for (const variable of variables) {
    if (!process.env[variable]) {
      throw new Error(`Environment variable '${variable}' is not set!`)
    }
  }
}
