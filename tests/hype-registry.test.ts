import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { HypeAdded } from "../generated/schema"
import { HypeAdded as HypeAddedEvent } from "../generated/HypeRegistry/HypeRegistry"
import { handleHypeAdded } from "../src/hype-registry"
import { createHypeAddedEvent } from "./hype-registry-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let hype = Address.fromString("0x0000000000000000000000000000000000000001")
    let index = BigInt.fromI32(234)
    let newHypeAddedEvent = createHypeAddedEvent(hype, index)
    handleHypeAdded(newHypeAddedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("HypeAdded created and stored", () => {
    assert.entityCount("HypeAdded", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "HypeAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "hype",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "HypeAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "index",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
