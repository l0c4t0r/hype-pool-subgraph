import {
  Deposit,
  Rebalance,
  Withdraw,
  ZeroBurn,
} from "../../../generated/HypeRegistry/Hypervisor";
import { updateHypervisorRanges } from "../../helpers/feeGrowth";
import { BASE_POSITION, LIMIT_POSITION } from "../../helpers/constants";
import { updateUniswapV3PoolPositionFees } from "../../helpers/uniswapV3";

export function handleDeposit(event: Deposit): void {
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
}
export function handleWithdraw(event: Withdraw): void {
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
}
export function handleRebalance(event: Rebalance): void {
  // Set ranges
  updateHypervisorRanges(event.address, BASE_POSITION, event.block.number);
  updateHypervisorRanges(event.address, LIMIT_POSITION, event.block.number);
  // Update positions
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
}

export function handleZeroBurn(event: ZeroBurn): void {
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
}
