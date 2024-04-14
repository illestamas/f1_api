import dotenv from "dotenv"
import axios from "axios"

import { Driver } from "../types/driver"

describe("@Drivers", () => {
  let baseUrl: string

  beforeAll(() => {
    dotenv.config()
    baseUrl = `${process.env.HOST}:${process.env.PORT}`
  })

  describe("GET @api/drivers", () => {
    it("should return drivers", async () => {
      const response = await axios.get(`${baseUrl}/api/drivers`)

      expect(response.status).toBe(200)
      expect(response.data.length).toBeGreaterThan(0)
    })
  })

  describe("GET @api/drivers/shuffle", () => {
    it("should randomize driver ids", async () => {
      async function getDriverIds() {
        return (await axios.get(`${baseUrl}/api/drivers`)).data.map(
          (driver: Driver) => driver.place
        )
      }

      const beforeShuffleDriverIds = [...(await getDriverIds())]
      await axios.get(`${baseUrl}/api/drivers/shuffle`)
      const afterShuffleDriverIds = [...(await getDriverIds())]

      expect(beforeShuffleDriverIds).not.toEqual(afterShuffleDriverIds)
    })
  })

  describe("GET @api/drivers/image", () => {
    it("should return 4xx with message in response body if [code] is not provided in the request query when fetching driver's image", async () => {
      const params = {}
      const response = await axios.get(`${baseUrl}/api/drivers/image`, {
        params,
        validateStatus: () => true,
      })

      expect(response.status).toBe(400)
      expect(response.data.message).toBe(
        "[code] must be provided in request query!"
      )
    })

    it("should return warn message in response body if [code] cannot be mapped to a driver", async () => {
      const params = {
        code: "Dummy code",
      }
      const response = await axios.get(`${baseUrl}/api/drivers/image`, {
        params,
        validateStatus: () => true,
      })

      expect(response.status).toBe(200)
      expect(response.data.message).toBe("driver not found!")
    })

    it("should return image for a driver", async () => {
      const params = {
        code: "alb",
      }
      const response = await axios.get(`${baseUrl}/api/drivers/image`, {
        params,
        validateStatus: () => true,
      })

      expect(response.status).toBe(200)
      expect(response.data.imageUrl).toBeDefined()
    })

    it("should return image for a driver (ignoring case sensitiveness)", async () => {
      const params = {
        code: "AlB",
      }
      const response = await axios.get(`${baseUrl}/api/drivers/image`, {
        params,
        validateStatus: () => true,
      })

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
    })
  })

  describe("POST @api/drivers/:placeId/overtake", () => {
    it("should return error if 'placeId' is not a valid number", async () => {
      const placeId = "nan"
      const response = await axios.post(
        `${baseUrl}/api/drivers/${placeId}/overtake`,
        undefined,
        {
          validateStatus: () => true,
        }
      )

      expect(response.status).toBe(400)
      expect(response.data.message).toBe("[placeId] must be a valid number!")
    })

    it("should return error if 'driverId' is non-existing when overtaking", async () => {
      const driverId = 199
      const response = await axios.post(
        `${baseUrl}/api/drivers/${driverId}/overtake`
      )

      expect(response.data.message).toBe("driver not found!")
    })

    it("should return error if 'placeId' is 1 (already first, cannot overtake anyone)", async () => {
      const placeId = 1
      const response = await axios.post(
        `${baseUrl}/api/drivers/${placeId}/overtake`,
        undefined,
        {
          validateStatus: () => true,
        }
      )

      expect(response.status).toBe(400)
      expect(response.data.message).toBe(
        "Driver is already in the first position!"
      )
    })

    it("should overtake driver's position", async () => {
      async function getDrivers() {
        return (await axios.get(`${baseUrl}/api/drivers`)).data
      }
      const placeId = 2
      let drivers: Driver[]

      drivers = await getDrivers()
      const beforeDrivers = {
        overtakingDriver: drivers.find(
          (driver: Driver) => driver.place === placeId
        ),
        driverToOvertake: drivers.find(
          (driver: Driver) => driver.place === placeId - 1
        ),
      }

      await axios.post(`${baseUrl}/api/drivers/${placeId}/overtake`)
      drivers = await getDrivers()
      const afterDrivers = {
        overtakingDriver: drivers.find(
          (driver: Driver) => driver.place === placeId
        ),
        driverToOvertake: drivers.find(
          (driver: Driver) => driver.place === placeId - 1
        ),
      }

      expect(beforeDrivers?.overtakingDriver?.code).toBe(
        afterDrivers?.driverToOvertake?.code
      )
      expect(beforeDrivers?.driverToOvertake?.code).toBe(
        afterDrivers?.overtakingDriver?.code
      )
    })
  })
})
