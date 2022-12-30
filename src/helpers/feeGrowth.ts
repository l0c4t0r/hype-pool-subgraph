import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Tick } from "../../generated/schema";
import { Pool as PoolContract } from "../../generated/templates/Pool/Pool";
import { getOrCreatePool, getOrCreateTick } from "./entities";

export function updateFeeGrowthGlobal(poolAddress: Address): void {
  const pool = getOrCreatePool(poolAddress);
  const poolContract = PoolContract.bind(poolAddress);
  pool.feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128();
  pool.feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal1X128();

  pool.save();
}

export function updateTick(poolAddress: Address, tickIdx: i32): void {
  const tick = getOrCreateTick(poolAddress, tickIdx);

  const poolContract = PoolContract.bind(poolAddress);
  const tickResult = poolContract.ticks(tickIdx);
  tick.feeGrowthOutside0X128 = tickResult.getFeeGrowthOutside0X128();
  tick.feeGrowthOutside1X128 = tickResult.getFeeGrowthOutside1X128();
  
  tick.save();
}


export function updateTickIfExist(poolAddress: Address, tickIdx: i32): void {
  const tick = Tick.load(
    poolAddress
      .toHex()
      .concat('#')
      .concat(tickIdx.toString())
  )
  if (tick !== null) {
    updateTick(poolAddress, tickIdx)
  }
}

export function feeTierToTickSpacing(feeTier: BigInt): BigInt {
  if (feeTier.equals(BigInt.fromI32(100))) {
    return BigInt.fromI32(1)
  }

  return feeTier.div(BigInt.fromI32(50))
}