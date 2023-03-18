import { Address } from "@graphprotocol/graph-ts";
import {
  Rebalance,
  ZeroBurn,
} from "../../../generated/HypeRegistry/Hypervisor";
import { updateHypervisorRanges, updateTicks } from "../../helpers/feeGrowth";
import { BASE_POSITION, LIMIT_POSITION, PROTOCOL_ALGEBRA } from "../../config/constants";
import {
  updateSnapshotCurrentBlock,
  updateSnapshotPreviousBlock,
} from "../../helpers/snapshots";
import { updateTvl } from "../../helpers/hypervisor";
import { processZeroBurn } from "../common/hypervisor";
import { updateProtocolPoolPositionFees } from "../../helpers/common";
import { getOrCreateHypervisor } from "../../helpers/entities";
import { initFastSyncPools } from "../../helpers/fastSync";


export function handleRebalance(event: Rebalance): void {
  updateSnapshotPreviousBlock(
    event.address,
    event.block.number,
    event.block.timestamp
  );
  // Set ranges
  updateHypervisorRanges(event.address, event.block.number, PROTOCOL_ALGEBRA);
  // Force updates on everything as rebalance changes ranges
  updateProtocolPoolPositionFees(
    event.address,
    BASE_POSITION,
    event.block.number,
    PROTOCOL_ALGEBRA,
    true
  );
  updateProtocolPoolPositionFees(
    event.address,
    LIMIT_POSITION,
    event.block.number,
    PROTOCOL_ALGEBRA,
    true
  );
  updateTvl(event.address, event.block.number);

  // Update ticks as well before snapshot
  const hypervisor = getOrCreateHypervisor(event.address);
  updateTicks(
    Address.fromBytes(hypervisor.pool),
    event.block.number,
    PROTOCOL_ALGEBRA,
    false
  );
  updateSnapshotCurrentBlock(event.address, event.block.number, true);
  initFastSyncPools(event.address, event.block)
}

export function handleZeroBurn(event: ZeroBurn): void {
  processZeroBurn(event.address, event.block);
}
