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
import { encodeKey } from "./pool";
import {
  getOrCreateToken,
} from "./entities";
import { PROTOCOL_UNISWAP_V3 } from "../config/constants";

export function createUniswapV3Pool(poolAddress: Address): Pool | null {
  const poolContract = PoolContract.bind(poolAddress);
  const slot0 = poolContract.try_slot0();

  if (slot0.reverted) {
    return null;
  }

  const pool = new Pool(poolAddress);
  const token0 = getOrCreateToken(poolContract.token0());
  const token1 = getOrCreateToken(poolContract.token1());

  pool.token0 = token0.id;
  pool.token1 = token1.id;
  pool.tickSpacing = tickSpacingFromFee(poolContract.fee());
  pool.currentTick = slot0.value.getTick();
  pool.sqrtPriceX96 = slot0.value.getSqrtPriceX96();
  pool.feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128();
  pool.feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal0X128();
  pool._protocol = PROTOCOL_UNISWAP_V3;

  return pool;
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
