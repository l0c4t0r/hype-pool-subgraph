import {
  Burn,
  Flash,
  Mint,
  Swap,
} from "../../../generated/templates/Pool/UniswapV3Pool";
import { getActiveTicks } from "../../helpers/feeGrowth";
import { getOrCreatePool } from "../../helpers/entities";
import {
  updateUniswapV3FeeGrowthGlobal,
  updateUniswapV3FeeGrowthOutside,
} from "../../helpers/uniswapV3";
import { updatePoolTick } from "../../helpers/pool";
import { tickCrossed } from "../../helpers/ticks";

export function handleMint(event: Mint): void {
  // Only need to update feeGrowthOutside on ticks that we care about
  const activeTicks = getActiveTicks(event.address);
  if (activeTicks.includes(event.params.tickLower)) {
    updateUniswapV3FeeGrowthOutside(
      event.address,
      event.params.tickLower,
      event.block.number
    );
  }
  if (activeTicks.includes(event.params.tickUpper)) {
    updateUniswapV3FeeGrowthOutside(
      event.address,
      event.params.tickUpper,
      event.block.number
    );
  }
}

export function handleBurn(event: Burn): void {
  // Only need to update feeGrowthOutside on ticks that we care about
  const activeTicks = getActiveTicks(event.address);
  if (activeTicks.includes(event.params.tickLower)) {
    updateUniswapV3FeeGrowthOutside(
      event.address,
      event.params.tickLower,
      event.block.number
    );
  }
  if (activeTicks.includes(event.params.tickUpper)) {
    updateUniswapV3FeeGrowthOutside(
      event.address,
      event.params.tickUpper,
      event.block.number
    );
  }
}

export function handleSwap(event: Swap): void {
  const pool = getOrCreatePool(event.address);
  const activeTicks = getActiveTicks(event.address);
  for (let i = 0; i < activeTicks.length; i++) {
    if (tickCrossed(activeTicks[i], pool.currentTick, event.params.tick)) {
      updateUniswapV3FeeGrowthOutside(
        event.address,
        activeTicks[i],
        event.block.number
      );
    }
  }
  updatePoolTick(event.address, event.params.tick);
  updateUniswapV3FeeGrowthGlobal(event.address, event.block.number);
}

export function handleFlash(event: Flash): void {
  // update globals, tick doesn't move for flash
  updateUniswapV3FeeGrowthGlobal(event.address, event.block.number);
}
