import dotenv from "dotenv"
import axios from "axios"
import { Driver } from "../../types/driver"

let baseUrl: string

beforeAll(() => {
  dotenv.config()
  baseUrl = `${process.env.HOST}:${process.env.PORT}`
})

test("should return drivers", async () => {
  const response = await axios.get(`${baseUrl}/api/drivers`)

  expect(response.status).toBe(200)
  expect(response.data.length).toBeGreaterThan(0)
})

test("should randomize driver ids", async () => {
  async function getDriverIds() {
    return (await axios.get(`${baseUrl}/api/drivers`)).data.map(
      (driver: Driver) => driver.id
    )
  }

  const beforeDriverIds = await getDriverIds()
  await axios.get(`${baseUrl}/api/drivers/shuffle`)
  const afterDriverIds = await getDriverIds()

  expect(beforeDriverIds).not.toEqual(afterDriverIds)
})

test("should return error if 'code' is not provided when fetching driver image", async () => {
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

test("should return warn if matching driver is not found for the provided driver 'code'", async () => {
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

test("should return image for driver code", async () => {
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

test("should return image for driver code (disregarding case sensitiveness)", async () => {
  const params = {
    code: "AlB",
  }
  const response = await axios.get(`${baseUrl}/api/drivers/image`, {
    params,
    validateStatus: () => true,
  })

  expect(response.status).toBe(200)
  expect(response.data.imageUrl).toBeDefined()
})

test("should return error if 'driverId' is not a valid number", async () => {
  const driverId = "nan"
  const response = await axios.post(
    `${baseUrl}/api/drivers/${driverId}/overtake`,
    undefined,
    {
      validateStatus: () => true,
    }
  )

  expect(response.status).toBe(400)
  expect(response.data.message).toBe("[driverId] must be a valid number!")
})

test("should return error if 'driverId' is non-existing when overtaking", async () => {
  const driverId = 199
  const response = await axios.post(
    `${baseUrl}/api/drivers/${driverId}/overtake`
  )

  expect(response.data.message).toBe("driver not found!")
})

test("should return error if 'driverId' is 0 (already first, cannot overtake anyone)", async () => {
  const driverId = 0
  const response = await axios.post(
    `${baseUrl}/api/drivers/${driverId}/overtake`,
    undefined,
    {
      validateStatus: () => true,
    }
  )

  expect(response.status).toBe(400)
  expect(response.data.message).toBe("Driver is already in the first position!")
})

test("should overtake drivers position", async () => {
  async function getDrivers() {
    return (await axios.get(`${baseUrl}/api/drivers`)).data
  }
  const driverId = 1
  let drivers: Driver[]

  drivers = await getDrivers()
  const beforeDrivers = {
    overtakingDriver: drivers.find((driver: Driver) => driver.id === driverId),
    driverToOvertake: drivers.find(
      (driver: Driver) => driver.id === driverId - 1
    ),
  }

  await axios.post(`${baseUrl}/api/drivers/${driverId}/overtake`)
  drivers = await getDrivers()
  const afterDrivers = {
    overtakingDriver: drivers.find((driver: Driver) => driver.id === driverId),
    driverToOvertake: drivers.find(
      (driver: Driver) => driver.id === driverId - 1
    ),
  }

  expect(beforeDrivers?.overtakingDriver?.code).toBe(
    afterDrivers?.driverToOvertake?.code
  )
  expect(beforeDrivers?.driverToOvertake?.code).toBe(
    afterDrivers?.overtakingDriver?.code
  )
})
