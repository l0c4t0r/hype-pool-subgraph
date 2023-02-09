import {
  Address,
  BigInt,
  ByteArray,
  Bytes,
  crypto,
  TypedMap,
} from "@graphprotocol/graph-ts";
import { Pool } from "../../generated/schema";
import { UniswapV3Pool as PoolContract } from "../../generated/templates/Pool/UniswapV3Pool";
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

export function createUniswapV3Pool(poolAddress: Address): Pool | null {
  const poolContract = PoolContract.bind(poolAddress);
  const slot0 = poolContract.try_slot0();

  if (slot0.reverted) {
    return null;
  }

  const pool = new Pool(poolAddress);

  pool.tickSpacing = tickSpacingFromFee(poolContract.fee());
  pool.currentTick = slot0.value.getTick();
  pool.feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128();
  pool.feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal0X128();

  return pool;
}

export function updateUniswapV3FeeGrowthGlobal(
  poolAddress: Address,
  blockNumber: BigInt
): void {
  if (!poolOutdated(poolAddress, blockNumber)) {
    return;
  }
  const poolContract = PoolContract.bind(poolAddress);
  updateFeeGrowthGlobal(
    poolAddress,
    poolContract.feeGrowthGlobal0X128(),
    poolContract.feeGrowthGlobal1X128(),
    blockNumber
  );
}

export function updateUniswapV3FeeGrowthOutside(
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
    tickInfo.getFeeGrowthOutside0X128(),
    tickInfo.getFeeGrowthOutside1X128(),
    blockNumber
  );
}

export function updateUniswapV3PoolPositionFees(
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
    position.getTokensOwed0(),
    position.getTokensOwed1(),
    position.getFeeGrowthInside0LastX128(),
    position.getFeeGrowthInside1LastX128()
  );
}

export function uniswapV3PositionKey(
  ownerAddress: Address,
  tickLower: i32,
  tickUpper: i32
): Bytes {
  const encodedHex = encodeKey(ownerAddress, tickLower, tickUpper).toHex();

  const encodedPacked =
    "0x" +
    encodedHex.substr(26, 40) +
    encodedHex.substr(124, 6) +
    encodedHex.substr(188, 6);

  const keyArray = crypto.keccak256(ByteArray.fromHexString(encodedPacked));
  const key = Bytes.fromByteArray(keyArray);

  return key as Bytes;
}

function tickSpacingFromFee(fee: i32): BigInt {
  const uniswapV3FeeToTickSpacing = new TypedMap<string, string>();
  uniswapV3FeeToTickSpacing.set("10000", "200");
  uniswapV3FeeToTickSpacing.set("3000", "60");
  uniswapV3FeeToTickSpacing.set("500", "10");
  uniswapV3FeeToTickSpacing.set("100", "1");

  const tickSpacing = uniswapV3FeeToTickSpacing.get(fee.toString());
  if (!tickSpacing) {
    return BigInt.fromI32(60);
  }
  return BigInt.fromString(tickSpacing!);
}
