import { BigInt } from "@graphprotocol/graph-ts";
import { ZERO_BI, Q256 } from "../config/constants";

function subIn256(x: BigInt, y: BigInt): BigInt {
  let diff = x.minus(y);
  if (diff < ZERO_BI) {
    diff = diff.plus(Q256);
  }
  return diff;
}

export function calcPositionFees(
  currentTick: BigInt,
  tickLower: BigInt,
  tickUpper: BigInt,
  lowerFeeGrowthOutside: BigInt,
  upperFeeGrowthOutside: BigInt,
  feeGrowthInside: BigInt,
  feeGrowthGlobal: BigInt,
  liquidity: BigInt
): BigInt {
  let feeGrowthBelow: BigInt;
  let feeGrowthAbove: BigInt;

  if (currentTick >= tickLower) {
    feeGrowthBelow = lowerFeeGrowthOutside;
  } else {
    feeGrowthBelow = subIn256(feeGrowthGlobal, lowerFeeGrowthOutside);
  }

  if (currentTick >= tickUpper) {
    feeGrowthAbove = subIn256(feeGrowthGlobal, upperFeeGrowthOutside);
  } else {
    feeGrowthAbove = upperFeeGrowthOutside;
  }

  const feesAccumNow = subIn256(
    subIn256(feeGrowthGlobal, feeGrowthBelow),
    feeGrowthAbove
  );

  return liquidity.times(subIn256(feesAccumNow, feeGrowthInside));
}
