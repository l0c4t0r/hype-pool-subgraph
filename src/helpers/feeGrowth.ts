import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Hypervisor as HypervisorContract } from "../../generated/HypeRegistry/Hypervisor";
import { Tick } from "../../generated/schema";
import { algebraPositionKey, updateAlgebraFeeGrowthOutside } from "./algebra";
import { BASE_POSITION, LIMIT_POSITION } from "./constants";
import {
  getOrCreateHypervisor,
  getOrCreateHypervisorPosition,
  getOrCreatePool,
  getOrCreateProtocol,
  getOrCreateTick,
} from "./entities";
import {
  uniswapV3PositionKey,
  updateUniswapV3FeeGrowthOutside,
} from "./uniswapV3";

export function updatePositionFees(
  hypervisorAddress: Address,
  positionType: string,
  liquidity: BigInt,
  tokensOwed0: BigInt,
  tokensOwed1: BigInt,
  feeGrowthInside0X128: BigInt,
  feeGrowthInside1X128: BigInt,
  blockNumber: BigInt
): void {
  const hypervisorPosition = getOrCreateHypervisorPosition(
    hypervisorAddress,
    positionType
  );
  hypervisorPosition.liquidity = liquidity;
  hypervisorPosition.tokensOwed0 = tokensOwed0;
  hypervisorPosition.tokensOwed1 = tokensOwed1;
  hypervisorPosition.feeGrowthInside0X128 = feeGrowthInside0X128;
  hypervisorPosition.feeGrowthInside1X128 = feeGrowthInside1X128;
  hypervisorPosition.lastUpdatedBlock = blockNumber;
  hypervisorPosition.save();
}

export function updateFeeGrowthOutside(
  poolAddress: Address,
  tickIdx: i32,
  feeGrowthOutside0X128: BigInt,
  feeGrowthOutside1X128: BigInt,
  blockNumber: BigInt
): void {
  const tick = getOrCreateTick(poolAddress, tickIdx);

  // Only store prev values the first time to prevent overwritten by forced update
  if (blockNumber > tick.lastUpdatedBlock) {
    tick._previousTickIdx = tick.tickIdx
    tick._previousFeeGrowthOutside0X128 = tick.feeGrowthOutside0X128
    tick._previousFeeGrowthOutside1X128 = tick.feeGrowthOutside1X128
  }
  tick.feeGrowthOutside0X128 = feeGrowthOutside0X128;
  tick.feeGrowthOutside1X128 = feeGrowthOutside1X128;
  tick.lastUpdatedBlock = blockNumber;
  tick.save();
}

export function updateFeeGrowthGlobal(
  poolAddress: Address,
  feeGrowthGlobal0X128: BigInt,
  feeGrowthGlobal1X128: BigInt,
  blockNumber: BigInt
): void {
  const pool = getOrCreatePool(poolAddress);

  // Only store prev values the first time to prevent overwritten by forced update
  if (blockNumber > pool.lastUpdatedBlock) {
    pool._previousTick = pool.currentTick
    pool._previousFeeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
    pool._previousFeeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  }
  pool.feeGrowthGlobal0X128 = feeGrowthGlobal0X128;
  pool.feeGrowthGlobal1X128 = feeGrowthGlobal1X128;
  pool.lastUpdatedBlock = blockNumber;
  pool.save();
}

export function updateHypervisorRanges(
  hypervisorAddress: Address,
  positionType: string,
  blockNumber: BigInt
): void {
  const protocol = getOrCreateProtocol();
  const hypervisor = getOrCreateHypervisor(hypervisorAddress);
  const poolAddress = Address.fromBytes(hypervisor.pool);

  const hypervisorContract = HypervisorContract.bind(hypervisorAddress);

  const position = getOrCreateHypervisorPosition(
    hypervisorAddress,
    positionType
  );

  const oldTickLower = Tick.load(position.tickLower);
  const oldTickUpper = Tick.load(position.tickUpper);

  let newTickLower = 0;
  let newTickUpper = 0;
  if (positionType == BASE_POSITION) {
    newTickLower = hypervisorContract.baseLower();
    newTickUpper = hypervisorContract.baseUpper();
  } else if (positionType == LIMIT_POSITION) {
    newTickLower = hypervisorContract.limitLower();
    newTickUpper = hypervisorContract.limitUpper();
  }

  if (protocol.underlyingProtocol == "algebra") {
    position.key = algebraPositionKey(
      hypervisorAddress,
      newTickLower,
      newTickUpper
    );
  } else {
    position.key = uniswapV3PositionKey(
      hypervisorAddress,
      newTickLower,
      newTickUpper
    );
  }

  const tickLower = getOrCreateTick(poolAddress, newTickLower);
  const tickUpper = getOrCreateTick(poolAddress, newTickUpper);

  // Initialize feeGrowth fields
  if (protocol.underlyingProtocol == "algebra") {
    updateAlgebraFeeGrowthOutside(poolAddress, newTickLower, blockNumber);
    updateAlgebraFeeGrowthOutside(poolAddress, newTickUpper, blockNumber);
  } else {
    updateUniswapV3FeeGrowthOutside(poolAddress, newTickLower, blockNumber);
    updateUniswapV3FeeGrowthOutside(poolAddress, newTickUpper, blockNumber);
  }

  position.tickLower = tickLower.id;
  position.tickUpper = tickUpper.id;
  position.save();

  // Update activeTicks in pool
  updateActiveTicks(
    poolAddress,
    [oldTickLower!.tickIdx, oldTickUpper!.tickIdx],
    [newTickLower, newTickUpper]
  );
}

export function hypervisorPositionUpToDate(
  hypervisorAddress: Address,
  positionType: string,
  testBlock: BigInt
): boolean {
  const position = getOrCreateHypervisorPosition(
    hypervisorAddress,
    positionType
  );
  return testBlock <= position.lastUpdatedBlock;
}

export function poolUpToDate(poolAddress: Address, testBlock: BigInt): boolean {
  const pool = getOrCreatePool(poolAddress);
  return testBlock <= pool.lastUpdatedBlock;
}

export function tickUpToDate(
  poolAddress: Address,
  tickIdx: i32,
  testBlock: BigInt
): boolean {
  const tick = getOrCreateTick(poolAddress, tickIdx);
  return testBlock <= tick.lastUpdatedBlock;
}

export function getActiveTicks(poolAddress: Address): i32[] {
  const pool = getOrCreatePool(poolAddress);
  return pool._ticksActive;
}

function updateActiveTicks(
  poolAddress: Address,
  ticksOld: i32[],
  ticksNew: i32[]
): void {
  const pool = getOrCreatePool(poolAddress);
  let activeTicks = new Set<i32>();

  for (let i = 0; i < pool._ticksActive.length; i++) {
    activeTicks.add(pool._ticksActive[i]);
  }

  // Delete old before adding new in case rebalance ranges are the same
  for (let i = 0; i < ticksOld.length; i++) {
    activeTicks.delete(ticksOld[i]);
  }

  for (let i = 0; i < ticksNew.length; i++) {
    activeTicks.add(ticksNew[i]);
  }

  pool._ticksActive = activeTicks.values();
  pool.save();
}
