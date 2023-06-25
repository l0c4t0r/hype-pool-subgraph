import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  updateProtocolFeeGrowthGlobal,
  updateProtocolFeeGrowthOutside,
} from "../../helpers/common";
import { getOrCreatePool, getOrCreateProtocol } from "../../helpers/entities";
import { getActiveTicks } from "../../helpers/feeGrowth";
import {
  poolMatchesUnderlyingProtocol,
  updateLinkedHypervisorTvl,
  updatePoolPricing,
} from "../../helpers/pool";
import { tickCrossed } from "../../helpers/ticks";
import { Protocol } from "../../../generated/schema";

export function processMint(
  poolAddress: Address,
  tickLower: i32,
  tickUpper: i32,
  blockNumber: BigInt
): void {
  const protocol = getOrCreateProtocol();
  if (!poolMatchesUnderlyingProtocol(poolAddress)) {
    return;
  }
  // Only need to update feeGrowthOutside on ticks that we care about
  const activeTicks = getActiveTicks(poolAddress);
  if (activeTicks.includes(tickLower)) {
    updateProtocolFeeGrowthOutside(
      poolAddress,
      tickLower,
      blockNumber,
      protocol
    );
  }
  if (activeTicks.includes(tickUpper)) {
    updateProtocolFeeGrowthOutside(
      poolAddress,
      tickUpper,
      blockNumber,
      protocol
    );
  }
}

export function processBurn(
  poolAddress: Address,
  tickLower: i32,
  tickUpper: i32,
  blockNumber: BigInt
): void {
  const protocol = getOrCreateProtocol();
  if (!poolMatchesUnderlyingProtocol(poolAddress)) {
    return;
  }
  // Only need to update feeGrowthOutside on ticks that we care about
  const activeTicks = getActiveTicks(poolAddress);
  if (activeTicks.includes(tickLower)) {
    updateProtocolFeeGrowthOutside(
      poolAddress,
      tickLower,
      blockNumber,
      protocol
    );
  }
  if (activeTicks.includes(tickUpper)) {
    updateProtocolFeeGrowthOutside(
      poolAddress,
      tickUpper,
      blockNumber,
      protocol
    );
  }
}

export function processSwap(
  poolAddress: Address,
  tick: i32,
  price: BigInt,
  block: ethereum.Block,
  protocol: Protocol
): void {
  const pool = getOrCreatePool(poolAddress);
  const previousTick = pool.currentTick;
  updatePoolPricing(poolAddress, tick, price, block);

  if (!poolMatchesUnderlyingProtocol(poolAddress)) {
    return;
  }

  const activeTicks = getActiveTicks(poolAddress);
  for (let i = 0; i < activeTicks.length; i++) {
    if (tickCrossed(activeTicks[i], previousTick, tick)) {
      updateProtocolFeeGrowthOutside(
        poolAddress,
        activeTicks[i],
        block.number,
        protocol
      );
    }
  }
  updateLinkedHypervisorTvl(poolAddress, block);
  updateProtocolFeeGrowthGlobal(
    poolAddress,
    block.number,
    protocol.underlyingProtocol
  );
}
