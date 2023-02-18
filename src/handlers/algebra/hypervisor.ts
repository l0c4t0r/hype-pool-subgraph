import {
  Rebalance,
  ZeroBurn,
} from "../../../generated/HypeRegistry/Hypervisor";
import { updateHypervisorRanges } from "../../helpers/feeGrowth";
import { BASE_POSITION, LIMIT_POSITION, PROTOCOL_ALGEBRA } from "../../helpers/constants";
import {
  updateSnapshotCurrentBlock,
  updateSnapshotPreviousBlock,
} from "../../helpers/snapshots";
import { updateTvl } from "../../helpers/hypervisor";
import { processZeroBurn } from "../common/hypervisor";
import { updateProtocolPoolPositionFees } from "../../helpers/common";
import { initFastSyncPools } from "../../helpers/fastSync";

export function handleRebalance(event: Rebalance): void {
  updateSnapshotPreviousBlock(
    event.address,
    event.block.number,
    event.block.timestamp
  );
  // Set ranges
  // Force updates on everything as rebalances changes ranges
  updateHypervisorRanges(event.address, event.block.number, PROTOCOL_ALGEBRA);
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
  updateSnapshotCurrentBlock(event.address, event.block.number, true);
  initFastSyncPools(event.address, event.block)
}

export function handleZeroBurn(event: ZeroBurn): void {
  processZeroBurn(event.address, event.block);
  initFastSyncPools(event.address, event.block)
}
