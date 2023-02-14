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
import { updateTvl } from "../../helpers/hypervisor";

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
  updateTvl(event.address, event.block.number)
  updateSnapshotCurrentBlock(
    event.address,
    event.block.number,
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
  updateTvl(event.address, event.block.number)
  updateSnapshotCurrentBlock(
    event.address,
    event.block.number,
    false
  );
}
