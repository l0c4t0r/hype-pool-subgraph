import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Mint, Burn, Swap, Flash } from "../generated/templates/Pool/Pool";
import { ZERO_BI } from "./helpers/constants";
import { getOrCreatePool } from "./helpers/entities";
import {
  feeTierToTickSpacing,
  updateFeeGrowthGlobal,
  updateTick,
  updateTickIfExist,
} from "./helpers/feeGrowth";

export function handleMint(event: Mint): void {
  updateTick(event.address, event.params.tickLower);
  updateTick(event.address, event.params.tickUpper);
}

export function handleBurn(event: Burn): void {
  updateTick(event.address, event.params.tickLower);
  updateTick(event.address, event.params.tickUpper);
}

export function handleSwap(event: Swap): void {
  updateFeeGrowthGlobal(event.address);

  const pool = getOrCreatePool(event.address);
  const oldTick = pool.tick;

  pool.tick = BigInt.fromI32(event.params.tick);
  pool.save();

  // Update inner vars of current or crossed ticks
  let newTick = pool.tick;
  let tickSpacing = feeTierToTickSpacing(pool.feeTier);
  let modulo = newTick.mod(tickSpacing);
  if (modulo.equals(ZERO_BI)) {
    // Current tick is initialized and needs to be updated
    updateTickIfExist(event.address, newTick.toI32())
  }

    let numIters = oldTick
      .minus(newTick)
      .abs()
      .div(tickSpacing)

    if (numIters.gt(BigInt.fromI32(100))) {
      // In case more than 100 ticks need to be updated ignore the update in
      // order to avoid timeouts. From testing this behavior occurs only upon
      // pool initialization. This should not be a big issue as the ticks get
      // updated later. For early users this error also disappears when calling
      // collect
    } else if (newTick.gt(oldTick)) {
      let firstInitialized = oldTick.plus(tickSpacing.minus(modulo))
      for (let i = firstInitialized; i.le(newTick); i = i.plus(tickSpacing)) {
        updateTickIfExist(event.address, i.toI32())
      }
    } else if (newTick.lt(oldTick)) {
      let firstInitialized = oldTick.minus(modulo)
      for (let i = firstInitialized; i.ge(newTick); i = i.minus(tickSpacing)) {
        updateTickIfExist(event.address, i.toI32())
      }
    }
}

export function handleFlash(event: Flash): void {
  updateFeeGrowthGlobal(event.address);
}

