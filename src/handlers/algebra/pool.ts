import {
  Burn,
  Flash,
  Mint,
  Swap,
} from "../../../generated/templates/Pool/AlgebraPool";
import { getActiveTicks } from "../../helpers/feeGrowth";
import {
  updateAlgebraFeeGrowthGlobal,
  updateAlgebraFeeGrowthOutside,
} from "../../helpers/algebra";
import { getOrCreatePool } from "../../helpers/entities";
import {
  poolMatchesUnderlyingProtocol,
  updateLinkedHypervisorTvl,
  updatePoolPricing,
} from "../../helpers/pool";
import { tickCrossed } from "../../helpers/ticks";

export function handleMint(event: Mint): void {
  if (!poolMatchesUnderlyingProtocol(event.address)) {
    return;
  }
  // Only need to update feeGrowthOutside on ticks that we care about
  const activeTicks = getActiveTicks(event.address);
  if (activeTicks.includes(event.params.bottomTick)) {
    updateAlgebraFeeGrowthOutside(
      event.address,
      event.params.bottomTick,
      event.block.number
    );
  }
  if (activeTicks.includes(event.params.topTick)) {
    updateAlgebraFeeGrowthOutside(
      event.address,
      event.params.topTick,
      event.block.number
    );
  }
}

export function handleBurn(event: Burn): void {
  if (!poolMatchesUnderlyingProtocol(event.address)) {
    return;
  }
  // Only need to update feeGrowthOutside on ticks that we care about
  const activeTicks = getActiveTicks(event.address);
  if (activeTicks.includes(event.params.bottomTick)) {
    updateAlgebraFeeGrowthOutside(
      event.address,
      event.params.bottomTick,
      event.block.number
    );
  }
  if (activeTicks.includes(event.params.topTick)) {
    updateAlgebraFeeGrowthOutside(
      event.address,
      event.params.topTick,
      event.block.number
    );
  }
}

export function handleSwap(event: Swap): void {
  updatePoolPricing(
    event.address,
    event.params.tick,
    event.params.price,
    event.block
  );
  
  if (!poolMatchesUnderlyingProtocol(event.address)) {
    return;
  }

  const pool = getOrCreatePool(event.address);
  const activeTicks = getActiveTicks(event.address);
  for (let i = 0; i < activeTicks.length; i++) {
    if (tickCrossed(activeTicks[i], pool.currentTick, event.params.tick)) {
      updateAlgebraFeeGrowthOutside(
        event.address,
        activeTicks[i],
        event.block.number
      );
    }
  }
  updateLinkedHypervisorTvl(event.address, event.block);
  updateAlgebraFeeGrowthGlobal(event.address, event.block.number);
}

export function handleFlash(event: Flash): void {
  const pool = getOrCreatePool(event.address);
  if (!poolMatchesUnderlyingProtocol(event.address)) {
    return;
  }
  // update globals, tick doesn't move for flash
  updateAlgebraFeeGrowthGlobal(event.address, event.block.number);
}
