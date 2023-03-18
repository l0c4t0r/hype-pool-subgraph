import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Pool } from "../../generated/schema";
import { AlgebraPool as PoolContract } from "../../generated/templates/Pool/AlgebraPool";
import {} from "./feeGrowth";
import { encodeKey } from "./pool";
import { getOrCreateToken } from "./entities";
import { PROTOCOL_ALGEBRA } from "../config/constants";

export function createAlgebraPool(poolAddress: Address): Pool | null {
  const poolContract = PoolContract.bind(poolAddress);
  const globalState = poolContract.try_globalState();

  if (globalState.reverted) {
    return null;
  }

  const pool = new Pool(poolAddress);

  const token0 = getOrCreateToken(poolContract.token0());
  const token1 = getOrCreateToken(poolContract.token1());

  pool.token0 = token0.id;
  pool.token1 = token1.id;
  pool.tickSpacing = BigInt.fromI32(poolContract.tickSpacing());
  pool.currentTick = globalState.value.getTick();
  pool.sqrtPriceX96 = globalState.value.getPrice();
  pool.feeGrowthGlobal0X128 = poolContract.totalFeeGrowth0Token();
  pool.feeGrowthGlobal1X128 = poolContract.totalFeeGrowth1Token();
  pool._protocol = PROTOCOL_ALGEBRA;

  return pool;
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
