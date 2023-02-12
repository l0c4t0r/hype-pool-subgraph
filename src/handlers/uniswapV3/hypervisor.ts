import {
  Deposit,
  Rebalance,
  Withdraw,
  ZeroBurn,
} from "../../../generated/HypeRegistry/Hypervisor";
import { updateHypervisorRanges } from "../../helpers/feeGrowth";
import { BASE_POSITION, LIMIT_POSITION } from "../../helpers/constants";
import { updateUniswapV3PoolPositionFees } from "../../helpers/uniswapV3";
import { updateSnapshotCurrentBlock, updateSnapshotPreviousBlock } from "../../helpers/snapshots";

export function handleDeposit(event: Deposit): void {
  updateSnapshotPreviousBlock(
    event.address,
    event.block.number,
    event.block.timestamp
  );
  updateUniswapV3PoolPositionFees(
    event.address,
    BASE_POSITION,
    event.block.number,
    false
  );
  updateUniswapV3PoolPositionFees(
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
export function handleWithdraw(event: Withdraw): void {
  updateSnapshotPreviousBlock(
    event.address,
    event.block.number,
    event.block.timestamp
  );
  updateUniswapV3PoolPositionFees(
    event.address,
    BASE_POSITION,
    event.block.number,
    false
  );
  updateUniswapV3PoolPositionFees(
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
export function handleRebalance(event: Rebalance): void {
  updateSnapshotPreviousBlock(
    event.address,
    event.block.number,
    event.block.timestamp
  );
  // Set ranges
  updateHypervisorRanges(event.address, BASE_POSITION, event.block.number);
  updateHypervisorRanges(event.address, LIMIT_POSITION, event.block.number);
  // Update positions
  // Force updates on everything as rebalance changes ranges
  updateUniswapV3PoolPositionFees(
    event.address,
    BASE_POSITION,
    event.block.number,
    true
  );
  updateUniswapV3PoolPositionFees(
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
  updateUniswapV3PoolPositionFees(
    event.address,
    BASE_POSITION,
    event.block.number,
    false
  );
  updateUniswapV3PoolPositionFees(
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
