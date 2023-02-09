import { Rebalance, ZeroBurn } from "../../../generated/HypeRegistry/Hypervisor";
import { updateHypervisorRanges } from "../../helpers/feeGrowth";
import { updateAlgebraPoolPositionFees } from "../../helpers/algebra";
import { BASE_POSITION, LIMIT_POSITION } from "../../helpers/constants";

export function handleRebalance(event: Rebalance): void {
  // Set ranges
  updateHypervisorRanges(event.address, BASE_POSITION, event.block.number);
  updateHypervisorRanges(event.address, LIMIT_POSITION, event.block.number);
  // Update position is handled in ZeroBurn
}

export function handleZeroBurn(event: ZeroBurn): void {
  updateAlgebraPoolPositionFees(
    event.address,
    BASE_POSITION,
    event.block.number
  );
  updateAlgebraPoolPositionFees(
    event.address,
    LIMIT_POSITION,
    event.block.number
  );
}
