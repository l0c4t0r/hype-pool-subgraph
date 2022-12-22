import {
  HypeAdded as HypeAddedEvent,
  HypeRemoved as HypeRemovedEvent
} from "../generated/HypeRegistry/HypeRegistry"
import { HypeAdded, HypeRemoved } from "../generated/schema"

export function handleHypeAdded(event: HypeAddedEvent): void {
  let entity = new HypeAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.hype = event.params.hype
  entity.index = event.params.index

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleHypeRemoved(event: HypeRemovedEvent): void {
  let entity = new HypeRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.hype = event.params.hype
  entity.index = event.params.index

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
