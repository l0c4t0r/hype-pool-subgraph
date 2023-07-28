import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Hypervisor as HypervisorContract } from "../../generated/HypeRegistry/Hypervisor";
import { Protocol, Tick } from "../../generated/schema";
import { algebraPositionKey } from "./algebra";
import { ramsesPositionKey } from "./ramses";
import { updateProtocolFeeGrowthOutside } from "./common";
import {
  BASE_POSITION,
  LIMIT_POSITION,
  PROTOCOL_ALGEBRA_V1,
  PROTOCOL_ALGEBRA_V2,
} from "../config/constants";
import {
  getOrCreateHypervisor,
  getOrCreateHypervisorPosition,
  getOrCreatePool,
  getOrCreateTick,
} from "./entities";
import { uniswapV3PositionKey } from "./uniswapV3";

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
    tick._previousTickIdx = tick.tickIdx;
    tick._previousFeeGrowthOutside0X128 = tick.feeGrowthOutside0X128;
    tick._previousFeeGrowthOutside1X128 = tick.feeGrowthOutside1X128;
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
    pool._previousTick = pool.currentTick;
    pool._previousFeeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128;
    pool._previousFeeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128;
  }
  pool.feeGrowthGlobal0X128 = feeGrowthGlobal0X128;
  pool.feeGrowthGlobal1X128 = feeGrowthGlobal1X128;
  pool.lastUpdatedBlock = blockNumber;
  pool.save();
}

export function updateHypervisorRanges(
  hypervisorAddress: Address,
  blockNumber: BigInt,
  protocol: Protocol,
  force: boolean = false
): void {
  updateHypervisorPositionRanges(
    hypervisorAddress,
    BASE_POSITION,
    blockNumber,
    protocol,
    force
  );
  updateHypervisorPositionRanges(
    hypervisorAddress,
    LIMIT_POSITION,
    blockNumber,
    protocol,
    force
  );

  const hypervisor = getOrCreateHypervisor(hypervisorAddress);
  updateActiveTicks(Address.fromBytes(hypervisor.pool));
}

function updateHypervisorPositionRanges(
  hypervisorAddress: Address,
  positionType: string,
  blockNumber: BigInt,
  protocol: Protocol,
  force: boolean = false
): void {
  const hypervisor = getOrCreateHypervisor(hypervisorAddress);
  const poolAddress = Address.fromBytes(hypervisor.pool);

  const hypervisorContract = HypervisorContract.bind(hypervisorAddress);

  const position = getOrCreateHypervisorPosition(
    hypervisorAddress,
    positionType
  );

  let newTickLower = 0;
  let newTickUpper = 0;
  if (positionType == BASE_POSITION) {
    newTickLower = hypervisorContract.baseLower();
    newTickUpper = hypervisorContract.baseUpper();
  } else if (positionType == LIMIT_POSITION) {
    newTickLower = hypervisorContract.limitLower();
    newTickUpper = hypervisorContract.limitUpper();
  }

  if (
    protocol.underlyingProtocol == PROTOCOL_ALGEBRA_V1 ||
    protocol.underlyingProtocol == PROTOCOL_ALGEBRA_V2
  ) {
    position.key = algebraPositionKey(
      hypervisorAddress,
      newTickLower,
      newTickUpper
    );
  } else {
    if (protocol.dex == "ramses") {
      position.key = ramsesPositionKey(
        hypervisorAddress,
        newTickLower,
        newTickUpper
      )
    } else {
      position.key = uniswapV3PositionKey(
        hypervisorAddress,
        newTickLower,
        newTickUpper
      );
    }
  }

  const tickLower = getOrCreateTick(poolAddress, newTickLower);
  const tickUpper = getOrCreateTick(poolAddress, newTickUpper);

  updateProtocolFeeGrowthOutside(
    poolAddress,
    newTickLower,
    blockNumber,
    protocol,
    force
  );
  updateProtocolFeeGrowthOutside(
    poolAddress,
    newTickUpper,
    blockNumber,
    protocol,
    force
  );

  position.tickLower = tickLower.id;
  position.tickUpper = tickUpper.id;
  position.save();
}

export function updateTicks(
  poolAddress: Address,
  blockNumber: BigInt,
  protocol: Protocol,
  force: boolean = false
): void {
  const pool = getOrCreatePool(poolAddress);
  for (let i = 0; i < pool._ticksActive.length; i++) {
    updateProtocolFeeGrowthOutside(
      poolAddress,
      pool._ticksActive[i],
      blockNumber,
      protocol,
      force
    );
  }
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

function getPositionTickIdx(
  hypervisorAddress: Address,
  positionType: string
): i32[] {
  const position = getOrCreateHypervisorPosition(
    hypervisorAddress,
    positionType
  );
  const tickLower = Tick.load(position.tickLower)!;
  const tickUpper = Tick.load(position.tickUpper)!;

  return [tickLower.tickIdx, tickUpper.tickIdx];
}

function updateActiveTicks(poolAddress: Address): void {
  const pool = getOrCreatePool(poolAddress);
  let activeTicks = new Set<i32>();
  for (let i = 0; i < pool._hypervisors.length; i++) {
    const hypervisorAddress = Address.fromString(pool._hypervisors[i]);
    const baseTicks = getPositionTickIdx(hypervisorAddress, BASE_POSITION);
    const limitTicks = getPositionTickIdx(hypervisorAddress, LIMIT_POSITION);
    activeTicks.add(baseTicks[0]);
    activeTicks.add(baseTicks[1]);
    activeTicks.add(limitTicks[0]);
    activeTicks.add(limitTicks[1]);
  }

  pool._ticksActive = activeTicks.values();
  pool.save();
}
