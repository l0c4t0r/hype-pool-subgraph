import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Pool } from "../../generated/schema";
import { AlgebraPool as PoolContract } from "../../generated/templates/Pool/AlgebraPool";
import {
  hypervisorPositionOutdated,
  poolOutdated,
  tickOutdated,
  updateFeeGrowthGlobal,
  updateFeeGrowthOutside,
  updatePositionFees,
} from "./feeGrowth";
import { encodeKey } from "./pool";
import {
  getOrCreateHypervisor,
  getOrCreateHypervisorPosition,
} from "./entities";

export function createAlgebraPool(poolAddress: Address): Pool | null {
  const poolContract = PoolContract.bind(poolAddress);
  const globalState = poolContract.try_globalState();

  if (globalState.reverted) {
    return null;
  }

  const pool = new Pool(poolAddress);

  pool.tickSpacing = BigInt.fromI32(poolContract.tickSpacing());
  pool.currentTick = globalState.value.getTick();
  pool.feeGrowthGlobal0X128 = poolContract.totalFeeGrowth0Token();
  pool.feeGrowthGlobal1X128 = poolContract.totalFeeGrowth1Token();

  return pool;
}

export function updateAlgebraFeeGrowthGlobal(
  poolAddress: Address,
  blockNumber: BigInt
): void {
  if (!poolOutdated(poolAddress, blockNumber)) {
    return;
  }
  const poolContract = PoolContract.bind(poolAddress);
  updateFeeGrowthGlobal(
    poolAddress,
    poolContract.totalFeeGrowth0Token(),
    poolContract.totalFeeGrowth1Token(),
    blockNumber
  );
}

export function updateAlgebraFeeGrowthOutside(
  poolAddress: Address,
  tickIdx: i32,
  blockNumber: BigInt
): void {
  if (!tickOutdated(poolAddress, tickIdx, blockNumber)) {
    return;
  }
  const poolContract = PoolContract.bind(poolAddress);
  const tickInfo = poolContract.ticks(tickIdx);

  updateFeeGrowthOutside(
    poolAddress,
    tickIdx,
    tickInfo.getOuterFeeGrowth0Token(),
    tickInfo.getOuterFeeGrowth1Token(),
    blockNumber
  );
}

export function updateAlgebraPoolPositionFees(
  hypervisorAddress: Address,
  positionType: string,
  blockNumber: BigInt
): void {
  if (
    !hypervisorPositionOutdated(hypervisorAddress, positionType, blockNumber)
  ) {
    return;
  }
  const hypervisorPosition = getOrCreateHypervisorPosition(
    hypervisorAddress,
    positionType
  );

  if (!hypervisorPosition.key) {
    return;
  }

  const hypervisor = getOrCreateHypervisor(hypervisorAddress);
  const poolContract = PoolContract.bind(Address.fromBytes(hypervisor.pool));
  const position = poolContract.positions(hypervisorPosition.key!);

  updatePositionFees(
    hypervisorAddress,
    positionType,
    position.getLiquidity(),
    position.getFees0(),
    position.getFees1(),
    position.getInnerFeeGrowth0Token(),
    position.getInnerFeeGrowth1Token()
  );
}

export function algebraPositionKey(
  ownerAddress: Address,
  tickLower: i32,
  tickUpper: i32
): Bytes {
  const encodedHex = encodeKey(ownerAddress, tickLower, tickUpper).toHex();

  const encodedPacked =
    "0x000000000000" +
    encodedHex.substr(26, 40) +
    encodedHex.substr(124, 6) +
    encodedHex.substr(188, 6);

  const key = Bytes.fromHexString(encodedPacked);

  return key as Bytes;
}
