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
  if (!poolMatchesUnderlyingProtocol(event.address)) {
    return;
  }
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
  updatePoolPricing(
    event.address,
    event.params.tick,
    event.params.sqrtPriceX96,
    event.block
  );

  if (!poolMatchesUnderlyingProtocol(event.address)) {
    return;
  }

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
  updateLinkedHypervisorTvl(event.address, event.block);
  updateUniswapV3FeeGrowthGlobal(event.address, event.block.number);
}

export function handleFlash(event: Flash): void {
  if (!poolMatchesUnderlyingProtocol(event.address)) {
    return;
  }
  // update globals, tick doesn't move for flash
  updateUniswapV3FeeGrowthGlobal(event.address, event.block.number);
}
