import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { AlgebraV1Pool as AlgebraV1PoolContract } from "../../generated/templates/Pool/AlgebraV1Pool";
import { AlgebraV2Pool as AlgebraV2PoolContract } from "../../generated/templates/Pool/AlgebraV2Pool";
import { AlgebraIntegralPool as AlgebraIntegralPoolContract } from "../../generated/templates/Pool/AlgebraIntegralPool";
import { CamelotPool as CamelotPoolContract } from "../../generated/templates/Pool/CamelotPool";
import { UniswapV3Pool as UniswapPoolContract } from "../../generated/templates/Pool/UniswapV3Pool";
import { RamsesV2Pool as RamsesV2PoolContract } from "../../generated/templates/Pool/RamsesV2Pool";
import {
  BASE_POSITION,
  LIMIT_POSITION,
  PROTOCOL_ALGEBRA_V1,
  PROTOCOL_ALGEBRA_V2,
  PROTOCOL_ALGEBRA_INTEGRAL,
} from "../config/constants";
import {
  getOrCreateHypervisor,
  getOrCreateHypervisorPosition,
  getOrCreateProtocol,
} from "./entities";
import {
  hypervisorPositionUpToDate,
  poolUpToDate,
  tickUpToDate,
  updateFeeGrowthGlobal,
  updateFeeGrowthOutside,
  updateHypervisorRanges,
  updatePositionFees,
} from "./feeGrowth";
import { updateLinkedHypervisorTvl, updatePoolPricing } from "./pool";
import { Protocol } from "../../generated/schema";

export function updateProtocolFeeGrowthOutside(
  poolAddress: Address,
  tickIdx: i32,
  blockNumber: BigInt,
  protocol: Protocol,
  force: boolean = false
): void {
  if (tickUpToDate(poolAddress, tickIdx, blockNumber) && !force) {
    return;
  }

  let feeGrowthOutside0X128: BigInt;
  let feeGrowthOutside1X128: BigInt;

  if (protocol.underlyingProtocol == PROTOCOL_ALGEBRA_V1) {
    if (protocol.dex == "camelot") {
      const camelotPoolContract = CamelotPoolContract.bind(poolAddress);
      const tickInfo = camelotPoolContract.ticks(tickIdx);
      feeGrowthOutside0X128 = tickInfo.getOuterFeeGrowth0Token();
      feeGrowthOutside1X128 = tickInfo.getOuterFeeGrowth1Token();
    } else {
      const algebraPoolContract = AlgebraV1PoolContract.bind(poolAddress);
      const tickInfo = algebraPoolContract.ticks(tickIdx);
      feeGrowthOutside0X128 = tickInfo.getOuterFeeGrowth0Token();
      feeGrowthOutside1X128 = tickInfo.getOuterFeeGrowth1Token();
    }
  } else if (protocol.underlyingProtocol == PROTOCOL_ALGEBRA_V2) {
    const algebraPoolContract = AlgebraV2PoolContract.bind(poolAddress);
    const tickInfo = algebraPoolContract.ticks(tickIdx);
    feeGrowthOutside0X128 = tickInfo.getOuterFeeGrowth0Token();
    feeGrowthOutside1X128 = tickInfo.getOuterFeeGrowth1Token();
  } else if (protocol.underlyingProtocol == PROTOCOL_ALGEBRA_INTEGRAL) {
    const algebraPoolContract = AlgebraIntegralPoolContract.bind(poolAddress);
    const tickInfo = algebraPoolContract.ticks(tickIdx);
    feeGrowthOutside0X128 = tickInfo.getOuterFeeGrowth0Token();
    feeGrowthOutside1X128 = tickInfo.getOuterFeeGrowth1Token();
  } else {
    if (
      protocol.dex == "ramses" ||
      protocol.dex == "pharaoh" ||
      protocol.dex == "nile"
    ) {
      const ramsesPoolContract = RamsesV2PoolContract.bind(poolAddress);
      const tickInfo = ramsesPoolContract.ticks(tickIdx);
      feeGrowthOutside0X128 = tickInfo.getFeeGrowthOutside0X128();
      feeGrowthOutside1X128 = tickInfo.getFeeGrowthOutside1X128();
    } else {
      const uniswapPoolContract = UniswapPoolContract.bind(poolAddress);
      const tickInfo = uniswapPoolContract.ticks(tickIdx);
      feeGrowthOutside0X128 = tickInfo.getFeeGrowthOutside0X128();
      feeGrowthOutside1X128 = tickInfo.getFeeGrowthOutside1X128();
    }
  }

  updateFeeGrowthOutside(
    poolAddress,
    tickIdx,
    feeGrowthOutside0X128,
    feeGrowthOutside1X128,
    blockNumber
  );
}

export function updateProtocolFeeGrowthGlobal(
  poolAddress: Address,
  blockNumber: BigInt,
  protocol: string,
  force: boolean = false
): void {
  if (poolUpToDate(poolAddress, blockNumber) && !force) {
    return;
  }

  let feeGrowthGlobal0X128: BigInt;
  let feeGrowthGlobal1X128: BigInt;

  if (protocol == PROTOCOL_ALGEBRA_V1) {
    const algebraPoolContract = AlgebraV1PoolContract.bind(poolAddress);
    feeGrowthGlobal0X128 = algebraPoolContract.totalFeeGrowth0Token();
    feeGrowthGlobal1X128 = algebraPoolContract.totalFeeGrowth1Token();
  } else if (protocol == PROTOCOL_ALGEBRA_V2) {
    const algebraPoolContract = AlgebraV2PoolContract.bind(poolAddress);
    feeGrowthGlobal0X128 = algebraPoolContract.totalFeeGrowth0Token();
    feeGrowthGlobal1X128 = algebraPoolContract.totalFeeGrowth1Token();
  } else if (protocol == PROTOCOL_ALGEBRA_INTEGRAL) {
    const algebraPoolContract = AlgebraIntegralPoolContract.bind(poolAddress);
    feeGrowthGlobal0X128 = algebraPoolContract.totalFeeGrowth0Token();
    feeGrowthGlobal1X128 = algebraPoolContract.totalFeeGrowth1Token();
  } else {
    const uniswapPoolContract = UniswapPoolContract.bind(poolAddress);
    feeGrowthGlobal0X128 = uniswapPoolContract.feeGrowthGlobal0X128();
    feeGrowthGlobal1X128 = uniswapPoolContract.feeGrowthGlobal1X128();
  }

  updateFeeGrowthGlobal(
    poolAddress,
    feeGrowthGlobal0X128,
    feeGrowthGlobal1X128,
    blockNumber
  );
}

export function updateProtocolPoolPositionFees(
  hypervisorAddress: Address,
  positionType: string,
  blockNumber: BigInt,
  protocol: string,
  forceUpdate: boolean = false
): void {
  if (
    hypervisorPositionUpToDate(hypervisorAddress, positionType, blockNumber) &&
    !forceUpdate
  ) {
    return;
  }
  const hypervisorPosition = getOrCreateHypervisorPosition(
    hypervisorAddress,
    positionType
  );

  if (!hypervisorPosition.key) {
    return;
  }

  const hypervisor = getOrCreateHypervisor(hypervisorAddress);
  const poolAddress = Address.fromBytes(hypervisor.pool);

  let liquidity: BigInt;
  let tokensOwed0: BigInt;
  let tokensOwed1: BigInt;
  let feeGrowthInside0X128: BigInt;
  let feeGrowthInside1X128: BigInt;

  if (protocol == PROTOCOL_ALGEBRA_V1) {
    const algebraPoolContract = AlgebraV1PoolContract.bind(poolAddress);
    const position = algebraPoolContract.positions(hypervisorPosition.key!);
    liquidity = position.getLiquidity();
    tokensOwed0 = position.getFees0();
    tokensOwed1 = position.getFees1();
    feeGrowthInside0X128 = position.getInnerFeeGrowth0Token();
    feeGrowthInside1X128 = position.getInnerFeeGrowth1Token();
  } else if (protocol == PROTOCOL_ALGEBRA_V2) {
    const algebraPoolContract = AlgebraV2PoolContract.bind(poolAddress);
    const position = algebraPoolContract.positions(hypervisorPosition.key!);
    liquidity = position.getLiquidity();
    tokensOwed0 = position.getFees0();
    tokensOwed1 = position.getFees1();
    feeGrowthInside0X128 = position.getInnerFeeGrowth0Token();
    feeGrowthInside1X128 = position.getInnerFeeGrowth1Token();
  } else if (protocol == PROTOCOL_ALGEBRA_INTEGRAL) {
    const algebraPoolContract = AlgebraIntegralPoolContract.bind(poolAddress);
    const position = algebraPoolContract.positions(hypervisorPosition.key!);
    liquidity = position.getLiquidity();
    tokensOwed0 = position.getFees0();
    tokensOwed1 = position.getFees1();
    feeGrowthInside0X128 = position.getInnerFeeGrowth0Token();
    feeGrowthInside1X128 = position.getInnerFeeGrowth1Token();
  } else {
    const uniswapPoolContract = UniswapPoolContract.bind(poolAddress);
    const position = uniswapPoolContract.positions(hypervisorPosition.key!);
    liquidity = position.getLiquidity();
    tokensOwed0 = position.getTokensOwed0();
    tokensOwed1 = position.getTokensOwed1();
    feeGrowthInside0X128 = position.getFeeGrowthInside0LastX128();
    feeGrowthInside1X128 = position.getFeeGrowthInside1LastX128();
  }

  updatePositionFees(
    hypervisorAddress,
    positionType,
    liquidity,
    tokensOwed0,
    tokensOwed1,
    feeGrowthInside0X128,
    feeGrowthInside1X128,
    blockNumber
  );
}

export function fullRefresh(
  hypervisorAddress: Address,
  block: ethereum.Block
): void {
  const protocol = getOrCreateProtocol();

  const hypervisor = getOrCreateHypervisor(hypervisorAddress);
  const poolAddress = Address.fromBytes(hypervisor.pool);
  updateHypervisorRanges(hypervisorAddress, block.number, protocol, true);
  updateProtocolPoolPositionFees(
    hypervisorAddress,
    BASE_POSITION,
    block.number,
    protocol.underlyingProtocol,
    true
  );
  updateProtocolPoolPositionFees(
    hypervisorAddress,
    LIMIT_POSITION,
    block.number,
    protocol.underlyingProtocol,
    true
  );

  let tick: i32;
  let price: BigInt;

  if (protocol.underlyingProtocol == PROTOCOL_ALGEBRA_V1) {
    const algebraPoolContract = AlgebraV1PoolContract.bind(poolAddress);
    const globalState = algebraPoolContract.globalState();
    tick = globalState.getTick();
    price = globalState.getPrice();
  } else if (protocol.underlyingProtocol == PROTOCOL_ALGEBRA_V2) {
    const algebraPoolContract = AlgebraV2PoolContract.bind(poolAddress);
    const globalState = algebraPoolContract.globalState();
    tick = globalState.getTick();
    price = globalState.getPrice();
  } else if (protocol.underlyingProtocol == PROTOCOL_ALGEBRA_INTEGRAL) {
    const algebraPoolContract = AlgebraIntegralPoolContract.bind(poolAddress);
    const globalState = algebraPoolContract.globalState();
    tick = globalState.getTick();
    price = globalState.getPrice();
  } else {
    const uniswapPoolContract = UniswapPoolContract.bind(poolAddress);
    const slot0 = uniswapPoolContract.slot0();
    tick = slot0.getTick();
    price = slot0.getSqrtPriceX96();
  }

  updateProtocolFeeGrowthGlobal(
    poolAddress,
    block.number,
    protocol.underlyingProtocol,
    true
  );
  updatePoolPricing(poolAddress, tick, price, block);
  updateLinkedHypervisorTvl(poolAddress, block, true);

  log.info("Performed full refresh on {} at block: {}", [
    hypervisorAddress.toHex(),
    block.number.toString(),
  ]);
}
