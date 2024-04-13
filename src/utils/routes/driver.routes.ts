import express, { Request, Response } from "express"
import { Driver } from "../../types/driver"

import * as path from "path"
import * as fs from "fs"
import { shuffle } from "../shuffle"
import { isNumber } from "../isNumber"

let drivers: Driver[]

function loadDrivers() {
  const url = path.join(process.cwd(), "data", "drivers.json")
  drivers = JSON.parse(fs.readFileSync(url, "utf-8"))
}

function shuffleDrivers() {
  const driverIds = drivers.map((driver) => driver.id)
  const randomizedDriverIds = shuffle([...driverIds])

  for (let i = 0; i < randomizedDriverIds.length; i++) {
    drivers[i].id = randomizedDriverIds[i]
  }

  if (driverIds === randomizedDriverIds) {
    return shuffleDrivers()
  }
}

loadDrivers()
shuffleDrivers()

const router = express.Router()
router.get("/shuffle", (req: Request, res: Response) => {
  shuffleDrivers()

  res.json({
    message: "Drivers shuffled!",
  })
})

router.get("/", (req: Request, res: Response) => {
  res.json(drivers)
})

router.get("/image", (req: Request, res: Response) => {
  const code = req.query.code as string | undefined
  if (!code) {
    return res
      .status(400)
      .json({ message: "[code] must be provided in request query!" })
  }
  const driver = drivers.find(
    (driver) => driver.code.toLowerCase() === code.toLowerCase()
  )
  if (!driver) {
    return res.json({ message: "driver not found!" })
  }

  const imageUrl = path.join(process.cwd(), "data", "pictures", `${code}.png`)

  res.json({
    imageUrl,
  })
})

router.post("/:driverId/overtake", (req: Request, res: Response) => {
  const driverId = req.params.driverId

  if (!isNumber(driverId)) {
    return res
      .status(400)
      .json({ message: "[driverId] must be a valid number!" })
  }

  if (Number(driverId) === 0) {
    return res
      .status(400)
      .json({ message: "Driver is already in the first position!" })
  }

  const driver = drivers.find((driver) => driver.id === Number(driverId))
  if (!driver) {
    return res.json({ message: "driver not found!" })
  }

  const driverToOvertake = drivers.find(
    (driver) => driver.id === Number(driverId) - 1
  )
  if (!driverToOvertake) {
    return res.json({ message: "driver not found!" })
  }

  driver.id = Number(driverId) - 1
  driverToOvertake.id = Number(driverId)

  res.json({ works: true })
})

export default router
