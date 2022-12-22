import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import { HypeAdded, HypeRemoved } from "../generated/HypeRegistry/HypeRegistry"

export function createHypeAddedEvent(hype: Address, index: BigInt): HypeAdded {
  let hypeAddedEvent = changetype<HypeAdded>(newMockEvent())

  hypeAddedEvent.parameters = new Array()

  hypeAddedEvent.parameters.push(
    new ethereum.EventParam("hype", ethereum.Value.fromAddress(hype))
  )
  hypeAddedEvent.parameters.push(
    new ethereum.EventParam("index", ethereum.Value.fromUnsignedBigInt(index))
  )

  return hypeAddedEvent
}

export function createHypeRemovedEvent(
  hype: Address,
  index: BigInt
): HypeRemoved {
  let hypeRemovedEvent = changetype<HypeRemoved>(newMockEvent())

  hypeRemovedEvent.parameters = new Array()

  hypeRemovedEvent.parameters.push(
    new ethereum.EventParam("hype", ethereum.Value.fromAddress(hype))
  )
  hypeRemovedEvent.parameters.push(
    new ethereum.EventParam("index", ethereum.Value.fromUnsignedBigInt(index))
  )

  return hypeRemovedEvent
}
