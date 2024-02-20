import { Address, ethereum } from "@graphprotocol/graph-ts";
import { fullRefresh } from "./common";
import { FAST_SYNC } from "../config/fastSync";
import { getOrCreateFastSync, getOrCreatePool } from "./entities";
import { poolTemplateCreate } from "./pool";

export function triagePoolForFastSync(poolAddress: Address): void {
  if (!FAST_SYNC) {
    poolTemplateCreate(poolAddress);
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
    poolTemplateCreate(poolAddress);
  }
}

export function initFastSyncPools(block: ethereum.Block): void {
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
      poolTemplateCreate(poolAddress);
      const pool = getOrCreatePool(poolAddress, block.number);
      for (let j = 0; j < pool._hypervisors.length; j++) {
        fullRefresh(Address.fromString(pool._hypervisors[j]), block);
      }
    }
    fastSync.poolsInitialized = true;
    fastSync.save();
  }
}
