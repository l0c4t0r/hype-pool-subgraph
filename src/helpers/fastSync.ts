import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Pool as PoolTemplate } from "../../generated/templates";
import { fullRefresh } from "./common";
import { FAST_SYNC } from "../config/fastSync";
import { getOrCreateFastSync, getOrCreatePool } from "./entities";

export function triagePoolForFastSync(poolAddress: Address): void {
  if (!FAST_SYNC) {
    PoolTemplate.create(poolAddress);
    return;
  }
  const fastSync = getOrCreateFastSync();
  if (!fastSync.poolsInitialized) {
    // if pools not initialised yet, put it in queue
    if (!fastSync.pools.includes(poolAddress.toHex())) {
      // Pool is not in list yet
      const syncPools = fastSync.pools;
      syncPools.push(poolAddress.toHex());
      fastSync.pools = syncPools;
      fastSync.save();
    }
  } else {
    PoolTemplate.create(poolAddress);
  }
}

export function initFastSyncPools(
  hypervisorAddress: Address,
  block: ethereum.Block
): void {
  if (!FAST_SYNC) {
    return;
  }
  const fastSync = getOrCreateFastSync();
  if (
    fastSync.activated &&
    !fastSync.poolsInitialized &&
    block.number >= fastSync.syncBlock
  ) {
    for (let i = 0; i < fastSync.pools.length; i++) {
      const poolAddress = Address.fromString(fastSync.pools[i]);
      PoolTemplate.create(poolAddress);
      const pool = getOrCreatePool(poolAddress);
      for (let j = 0; j < pool._hypervisors.length; j++) {
        fullRefresh(Address.fromString(pool._hypervisors[j]), block);
      }
    }
    fastSync.poolsInitialized = true;
    fastSync.save();
  }
}
