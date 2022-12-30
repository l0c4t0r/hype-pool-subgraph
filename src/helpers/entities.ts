import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Pool as PoolContract } from "../../generated/templates/Pool/Pool";
import { Pool, Tick } from "../../generated/schema";
import { ZERO_BI } from "./constants";

export function getOrCreatePool(poolAddress: Address): Pool {
  let pool = Pool.load(poolAddress);
  if (!pool) {
    pool = new Pool(poolAddress);

    const poolContract = PoolContract.bind(poolAddress);

    const slot0 = poolContract.slot0();

    pool.feeTier = BigInt.fromI32(poolContract.fee());
    pool.tick = BigInt.fromI32(slot0.getTick());
    pool.feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128();
    pool.feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal0X128();
    pool.save();
  }
  return pool;
}

export function getOrCreateTick(poolAddress: Address, tickIdx: i32): Tick {
  const tickId = poolAddress
    .toHex()
    .concat("#")
    .concat(tickIdx.toString());
  let tick = Tick.load(tickId);
  if (!tick) {
    tick = new Tick(tickId);
    tick.pool = poolAddress;
    tick.tickIdx = BigInt.fromI32(tickIdx);
    tick.feeGrowthOutside0X128 = ZERO_BI;
    tick.feeGrowthOutside1X128 = ZERO_BI;
    tick.save();
  }
  return tick;
}
