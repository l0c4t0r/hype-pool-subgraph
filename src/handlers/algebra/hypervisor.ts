import {
  Rebalance,
  ZeroBurn,
} from "../../../generated/HypeRegistry/Hypervisor";
import { updateHypervisorRanges } from "../../helpers/feeGrowth";
import { updateAlgebraPoolPositionFees } from "../../helpers/algebra";
import { BASE_POSITION, LIMIT_POSITION } from "../../helpers/constants";
import {
  updateSnapshotCurrentBlock,
  updateSnapshotPreviousBlock,
} from "../../helpers/snapshots";

export function handleRebalance(event: Rebalance): void {
  updateSnapshotPreviousBlock(
    event.address,
    event.block.number,
    event.block.timestamp
  );
  // Set ranges
  // Force updates on everything as rebalances changes ranges
  updateHypervisorRanges(event.address, BASE_POSITION, event.block.number);
  updateHypervisorRanges(event.address, LIMIT_POSITION, event.block.number);
  updateAlgebraPoolPositionFees(
    event.address,
    BASE_POSITION,
    event.block.number,
    true
  );
  updateAlgebraPoolPositionFees(
    event.address,
    LIMIT_POSITION,
    event.block.number,
    true
  );
  updateSnapshotCurrentBlock(
    event.address,
    event.block.number,
    event.block.timestamp,
    true
  );
}

export function handleZeroBurn(event: ZeroBurn): void {
  updateSnapshotPreviousBlock(
    event.address,
    event.block.number,
    event.block.timestamp
  );
  updateAlgebraPoolPositionFees(
    event.address,
    BASE_POSITION,
    event.block.number,
    false
  );
  updateAlgebraPoolPositionFees(
    event.address,
    LIMIT_POSITION,
    event.block.number,
    false
  );
  updateSnapshotCurrentBlock(
    event.address,
    event.block.number,
    event.block.timestamp,
    false
  );
}
