import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { FeeSnapshot, Tick } from "../../generated/schema";
import {
  BASE_POSITION,
  CURRENT_BLOCK,
  LIMIT_POSITION,
  LOWER_TICK,
  PREVIOUS_BLOCK,
  UPPER_TICK,
} from "./constants";
import {
  createFeeSnapshot,
  getOrCreateFeeCollectionSnapshot,
  getOrCreateHypervisor,
  getOrCreateHypervisorPosition,
  getOrCreatePool,
  getOrCreatePositionSnapshot,
  getOrCreateTickSnapshot,
} from "./entities";

export function updateSnapshotPreviousBlock(
  hypervisorAddress: Address,
  block: BigInt,
  timestamp: BigInt
): void {
  let feeSnapshot = FeeSnapshot.load(
    hypervisorAddress
      .toHex()
      .concat("-")
      .concat(block.toString())
  );
  if (feeSnapshot) {
    return;
  }
  feeSnapshot = createFeeSnapshot(hypervisorAddress, block, timestamp);
  updateFeeCollectionSnapshot(hypervisorAddress, block, PREVIOUS_BLOCK);
}

export function updateSnapshotCurrentBlock(
  hypervisorAddress: Address,
  block: BigInt,
  timestamp: BigInt,
  forceUpdate: boolean = false
): void {
  // Check if current block requires update
  const currentBlock = getOrCreateFeeCollectionSnapshot(
    hypervisorAddress,
    block,
    CURRENT_BLOCK
  );
  if (currentBlock._initialized && !forceUpdate) {
    return;
  }
  updateFeeCollectionSnapshot(hypervisorAddress, block, CURRENT_BLOCK);
}

export function updateFeeCollectionSnapshot(
  hypervisorAddress: Address,
  block: BigInt,
  snapshotType: string
): void {
  const hypervisor = getOrCreateHypervisor(hypervisorAddress);
  const pool = getOrCreatePool(Address.fromBytes(hypervisor.pool));

  let feeCollectionSnapshot = getOrCreateFeeCollectionSnapshot(
    hypervisorAddress,
    block,
    snapshotType
  );

  if (snapshotType == PREVIOUS_BLOCK && block <= pool.lastUpdatedBlock) {
    // Pool was updated in the same block, snapshot previous values for previous block
    feeCollectionSnapshot.tick = pool._previousTick;
    feeCollectionSnapshot.feeGrowthGlobal0X128 =
      pool._previousFeeGrowthGlobal0X128;
    feeCollectionSnapshot.feeGrowthGlobal1X128 =
      pool._previousFeeGrowthGlobal1X128;
  } else {
    feeCollectionSnapshot.tick = pool.currentTick;
    feeCollectionSnapshot.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128;
    feeCollectionSnapshot.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128;
  }

  feeCollectionSnapshot._initialized = true;
  feeCollectionSnapshot.save();

  updatePositionSnapshot(hypervisorAddress, block, snapshotType, BASE_POSITION);
  updatePositionSnapshot(
    hypervisorAddress,
    block,
    snapshotType,
    LIMIT_POSITION
  );
}

export function updatePositionSnapshot(
  hypervisorAddress: Address,
  block: BigInt,
  snapshotType: string,
  positionType: string
): void {
  const hypervisorPosition = getOrCreateHypervisorPosition(
    hypervisorAddress,
    positionType
  );
  let positionSnapshot = getOrCreatePositionSnapshot(
    hypervisorAddress,
    block,
    snapshotType,
    positionType
  );
  positionSnapshot.liquidity = hypervisorPosition.liquidity;
  positionSnapshot.tokensOwed0 = hypervisorPosition.tokensOwed0;
  positionSnapshot.tokensOwed1 = hypervisorPosition.tokensOwed1;
  positionSnapshot.feeGrowthInside0X128 =
    hypervisorPosition.feeGrowthInside0X128;
  positionSnapshot.feeGrowthInside1X128 =
    hypervisorPosition.feeGrowthInside1X128;
  positionSnapshot.save();

  updateTickSnapshot(
    hypervisorAddress,
    block,
    snapshotType,
    positionType,
    LOWER_TICK
  );
  updateTickSnapshot(
    hypervisorAddress,
    block,
    snapshotType,
    positionType,
    UPPER_TICK
  );
}

export function updateTickSnapshot(
  hypervisorAddress: Address,
  block: BigInt,
  snapshotType: string,
  positionType: string,
  tickType: string
): void {
  const hypervisorPosition = getOrCreateHypervisorPosition(
    hypervisorAddress,
    positionType
  );

  let tick: Tick;
  if (tickType == LOWER_TICK) {
    tick = Tick.load(hypervisorPosition.tickLower)!;
  } else if (tickType == UPPER_TICK) {
    tick = Tick.load(hypervisorPosition.tickUpper)!;
  } else {
    log.warning(
      "Could not find {} tick for hypervisor: {} while updating snapshots at block: {}",
      [tickType, hypervisorAddress.toHex(), block.toString()]
    );
    return;
  }

  let tickSnapshot = getOrCreateTickSnapshot(
    hypervisorAddress,
    block,
    snapshotType,
    positionType,
    tickType
  );

  if (snapshotType == PREVIOUS_BLOCK && block <= tick.lastUpdatedBlock) {
    // Tick was updated in the same block, snapshot previous values for previous block
    tickSnapshot.tickIdx = tick._previousTickIdx;
    tickSnapshot.feeGrowthOutside0X128 = tick._previousFeeGrowthOutside0X128;
    tickSnapshot.feeGrowthOutside1X128 = tick._previousFeeGrowthOutside1X128;
  } else {
    tickSnapshot.tickIdx = tick.tickIdx;
    tickSnapshot.feeGrowthOutside0X128 = tick.feeGrowthOutside0X128;
    tickSnapshot.feeGrowthOutside1X128 = tick.feeGrowthOutside1X128;
  }

  tickSnapshot.save();
}
