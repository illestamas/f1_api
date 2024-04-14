import express, { Request, Response } from "express"
import { Driver } from "../types/driver"

import * as path from "path"
import * as fs from "fs"
import { shuffle } from "../utils/shuffle"
import { isNumber } from "../utils/isNumber"
import { logger } from "../logger/winston"

let drivers: Driver[]

function loadDrivers() {
  const url = path.join(process.cwd(), "data", "drivers.json")
  drivers = JSON.parse(fs.readFileSync(url, "utf-8"))
}

function shuffleDrivers() {
  for (const driver of drivers) {
    driver.place = driver.id + 1
  }

  const driverPlaces = drivers.map((driver) => driver.place)
  const randomizedDriverPlaces = shuffle([...driverPlaces])

  for (let i = 0; i < randomizedDriverPlaces.length; i++) {
    drivers[i].place = randomizedDriverPlaces[i]
  }

  if (driverPlaces === randomizedDriverPlaces) {
    return shuffleDrivers()
  }
}

loadDrivers()
shuffleDrivers()

const router = express.Router()

router.get("/", (req: Request, res: Response) => {
  res.json(drivers)
})

router.get("/shuffle", (req: Request, res: Response) => {
  shuffleDrivers()

  res.json({
    message: "Drivers shuffled!",
  })
})

router.get("/image", (req: Request, res: Response) => {
  const code = req.query.code as string | undefined
  if (!code) {
    return res
      .status(400)
      .json({ message: "[code] must be provided in request query!" })
  }
  logger.info(`Image requested for ${code}`)

  const driver = drivers.find(
    (driver) => driver.code.toLowerCase() === code.toLowerCase()
  )
  if (!driver) {
    return res.json({ message: "driver not found!" })
  }

  const imageUrl = path.join(process.cwd(), "data", "pictures", `${code}.png`)
  const imageFile = fs.readFileSync(imageUrl)

  const contentType = "image/png"
  res.json({
    imageUrl: `data:${contentType};base64,${imageFile.toString("base64")}`,
  })
})

router.post("/:placeId/overtake", (req: Request, res: Response) => {
  const placeId = req.params.placeId

  if (!isNumber(placeId)) {
    return res
      .status(400)
      .json({ message: "[placeId] must be a valid number!" })
  }

  if (Number(placeId) <= 1) {
    return res
      .status(400)
      .json({ message: "Driver is already in the first position!" })
  }
  logger.info(`Overtake requested for position: ${placeId}`)

  const overtakingDriver = drivers.find(
    (driver) => driver.place === Number(placeId)
  )
  if (!overtakingDriver) {
    return res.json({ message: "driver not found!" })
  }

  const driverToOvertake = drivers.find(
    (driver) => driver.place === Number(placeId) - 1
  )
  if (!driverToOvertake) {
    return res.json({ message: "driver not found!" })
  }

  overtakingDriver.place = Number(placeId) - 1
  driverToOvertake.place = Number(placeId)

  res.json({ message: "success", overtakingDriver, driverToOvertake })
})

export default router
