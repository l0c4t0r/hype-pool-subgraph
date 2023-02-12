import { Address, BigInt, dataSource } from "@graphprotocol/graph-ts";
import { Hypervisor as HypervisorContract } from "../../generated/HypeRegistry/Hypervisor";
import {
  FeeCollectionSnapshot,
  FeeSnapshot,
  Hypervisor,
  HypervisorPosition,
  Pool,
  PositionSnapshot,
  Protocol,
  Tick,
  TickSnapshot,
  Token,
} from "../../generated/schema";
import {
  BASE_POSITION,
  CURRENT_BLOCK,
  LIMIT_POSITION,
  LOWER_TICK,
  PREVIOUS_BLOCK,
  UPPER_TICK,
  VERSION,
  ZERO_BI,
} from "./constants";
import { createAlgebraPool } from "./algebra";
import { createUniswapV3Pool } from "./uniswapV3";
import { protocolLookup } from "./lookups";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./token";

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load("0");
  if (!protocol) {
    protocol = new Protocol("0");
    let network = dataSource.network();
    if (network == "arbitrum-one") {
      network = "arbitrum";
    }
    let name = "uniswap";
    let underlyingProtocol = "uniswapV3";
    const protocolInfo = protocolLookup.get(
      network.concat(":").concat(dataSource.address().toHex())
    );
    if (protocolInfo) {
      name = protocolInfo.name;
      underlyingProtocol = protocolInfo.underlyingProtocol;
    }

    protocol.name = "hypePool"
      .concat("-")
      .concat(name)
      .concat("-")
      .concat(underlyingProtocol)
      .concat("-")
      .concat(network)
      .concat("-")
      .concat(VERSION);
    protocol.underlyingProtocol = underlyingProtocol;
    protocol.network = network;
    protocol.version = VERSION;
    protocol.save();
  }
  return protocol;
}

export function getOrCreateHypervisor(hypervisorAddress: Address): Hypervisor {
  let hypervisor = Hypervisor.load(hypervisorAddress);

  if (!hypervisor) {
    hypervisor = new Hypervisor(hypervisorAddress);
    const hypervisorContract = HypervisorContract.bind(hypervisorAddress);

    const pool = getOrCreatePool(hypervisorContract.pool());
    hypervisor.pool = pool.id;

    const token0 = getOrCreateToken(hypervisorContract.token0())
    const token1 = getOrCreateToken(hypervisorContract.token1())

    hypervisor.token0 = token0.id
    hypervisor.token1 = token1.id

    const basePosition = getOrCreateHypervisorPosition(
      hypervisorAddress,
      BASE_POSITION
    );
    const limitPosition = getOrCreateHypervisorPosition(
      hypervisorAddress,
      LIMIT_POSITION
    );

    hypervisor.basePosition = basePosition.id;
    hypervisor.limitPosition = limitPosition.id;
    hypervisor.save();

    pool.save();
  }
  return hypervisor;
}

export function getOrCreateHypervisorPosition(
  hypervisorAddress: Address,
  positionType: string
): HypervisorPosition {
  const id = hypervisorAddress
    .toHex()
    .concat("-")
    .concat(positionType);

  let position = HypervisorPosition.load(id);

  if (!position) {
    const hypervisorContract = HypervisorContract.bind(hypervisorAddress);
    const poolAddress = hypervisorContract.pool();

    position = new HypervisorPosition(id);
    position.hypervisor = hypervisorAddress;
    position.type = positionType;

    const zeroTick = getOrCreateTick(poolAddress, 0);

    position.tickLower = zeroTick.id;
    position.tickUpper = zeroTick.id;
    position.liquidity = ZERO_BI;
    position.tokensOwed0 = ZERO_BI;
    position.tokensOwed1 = ZERO_BI;
    position.feeGrowthInside0X128 = ZERO_BI;
    position.feeGrowthInside1X128 = ZERO_BI;
    position.lastUpdatedBlock = ZERO_BI;
    position.save();
  }
  return position;
}

export function getOrCreatePool(poolAddress: Address): Pool {
  const protocol = getOrCreateProtocol();
  let pool = Pool.load(poolAddress);
  if (!pool) {
    if (protocol.underlyingProtocol == "uniswapV3") {
      pool = createUniswapV3Pool(poolAddress);
    } else if (protocol.underlyingProtocol == "algebra") {
      pool = createAlgebraPool(poolAddress);
    }
    if (pool) {
      pool._ticksActive = [];
      pool.lastUpdatedBlock = ZERO_BI;
      pool._previousTick = 0;
      pool._previousFeeGrowthGlobal0X128 = ZERO_BI;
      pool._previousFeeGrowthGlobal1X128 = ZERO_BI;
      pool.save();
    } else {
    }
  }
  return pool!; // More serious issues if pool is null here
}

export function getOrCreateTick(poolAddress: Address, tickIdx: i32): Tick {
  const tickId = poolAddress
    .toHex()
    .concat("#")
    .concat(tickIdx.toString());
  let tick = Tick.load(tickId);
  if (!tick) {
    tick = new Tick(tickId);
    tick.pool = poolAddress;
    tick.tickIdx = tickIdx;
    tick.feeGrowthOutside0X128 = ZERO_BI;
    tick.feeGrowthOutside1X128 = ZERO_BI;
    tick.lastUpdatedBlock = ZERO_BI;
    tick._previousTickIdx = 0;
    tick._previousFeeGrowthOutside0X128 = ZERO_BI;
    tick._previousFeeGrowthOutside1X128 = ZERO_BI;
    tick.save();
  }
  return tick;
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress);

  if (token == null) {
    token = new Token(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.save();
  }
  return token;
}

export function createFeeSnapshot(
  hypervisorAddress: Address,
  block: BigInt,
  timestamp: BigInt
): FeeSnapshot {
  const id = hypervisorAddress
    .toHex()
    .concat("-")
    .concat(block.toString());

  const feeSnapshot = new FeeSnapshot(id);
  feeSnapshot.hypervisor = hypervisorAddress;
  feeSnapshot.blockNumber = block;
  feeSnapshot.timestamp = timestamp;

  const previousBlock = getOrCreateFeeCollectionSnapshot(
    hypervisorAddress,
    block,
    PREVIOUS_BLOCK
  );
  const currentBlock = getOrCreateFeeCollectionSnapshot(
    hypervisorAddress,
    block,
    CURRENT_BLOCK
  );

  feeSnapshot.previousBlock = previousBlock.id;
  feeSnapshot.currentBlock = currentBlock.id;
  feeSnapshot.save();

  return feeSnapshot;
}

export function getOrCreateFeeCollectionSnapshot(
  hypervisorAddress: Address,
  block: BigInt,
  snapshotType: string
): FeeCollectionSnapshot {
  const feeSnapshotId = hypervisorAddress
    .toHex()
    .concat("-")
    .concat(block.toString());
  const id = feeSnapshotId.concat("-").concat(snapshotType);

  let feeCollectionSnapshot = FeeCollectionSnapshot.load(id);
  if (!feeCollectionSnapshot) {
    feeCollectionSnapshot = new FeeCollectionSnapshot(id);
    feeCollectionSnapshot.type = snapshotType;
    feeCollectionSnapshot.feeSnapshot = feeSnapshotId;
    feeCollectionSnapshot.tick = 0;
    feeCollectionSnapshot.feeGrowthGlobal0X128 = ZERO_BI;
    feeCollectionSnapshot.feeGrowthGlobal1X128 = ZERO_BI;

    const basePosition = getOrCreatePositionSnapshot(
      hypervisorAddress,
      block,
      snapshotType,
      BASE_POSITION
    );

    const limitPosition = getOrCreatePositionSnapshot(
      hypervisorAddress,
      block,
      snapshotType,
      LIMIT_POSITION
    );

    feeCollectionSnapshot.basePosition = basePosition.id;
    feeCollectionSnapshot.limitPosition = limitPosition.id;
    feeCollectionSnapshot._initialized = false;
    feeCollectionSnapshot.save();
  }
  return feeCollectionSnapshot;
}

export function getOrCreatePositionSnapshot(
  hypervisorAddress: Address,
  block: BigInt,
  snapshotType: string,
  positionType: string
): PositionSnapshot {
  const feeCollectionSnapshotId = hypervisorAddress
    .toHex()
    .concat("-")
    .concat(block.toString())
    .concat("-")
    .concat(snapshotType);

  const id = feeCollectionSnapshotId.concat("-").concat(positionType);

  let positionSnapshot = PositionSnapshot.load(id);

  if (!positionSnapshot) {
    positionSnapshot = new PositionSnapshot(id);
    positionSnapshot.type = positionType;
    positionSnapshot.feeCollectionSnapshot = feeCollectionSnapshotId;

    const tickLower = getOrCreateTickSnapshot(
      hypervisorAddress,
      block,
      snapshotType,
      positionType,
      LOWER_TICK
    );

    const tickUpper = getOrCreateTickSnapshot(
      hypervisorAddress,
      block,
      snapshotType,
      positionType,
      UPPER_TICK
    );

    positionSnapshot.tickLower = tickLower.id;
    positionSnapshot.tickUpper = tickUpper.id;
    positionSnapshot.liquidity = ZERO_BI;
    positionSnapshot.tokensOwed0 = ZERO_BI;
    positionSnapshot.tokensOwed1 = ZERO_BI;
    positionSnapshot.feeGrowthInside0X128 = ZERO_BI;
    positionSnapshot.feeGrowthInside1X128 = ZERO_BI;
    positionSnapshot.save();
  }
  return positionSnapshot;
}

export function getOrCreateTickSnapshot(
  hypervisorAddress: Address,
  block: BigInt,
  snapshotType: string,
  positionType: string,
  tickType: string
): TickSnapshot {
  const positionSnapshotId = hypervisorAddress
    .toHex()
    .concat("-")
    .concat(block.toString())
    .concat("-")
    .concat(snapshotType)
    .concat("-")
    .concat(positionType);

  const id = positionSnapshotId.concat("-").concat(tickType);

  let tickSnapshot = TickSnapshot.load(id);

  if (!tickSnapshot) {
    tickSnapshot = new TickSnapshot(id);
    tickSnapshot.type = tickType;
    tickSnapshot.positionSnapshot = positionSnapshotId;
    tickSnapshot.tickIdx = 0;
    tickSnapshot.feeGrowthOutside0X128 = ZERO_BI;
    tickSnapshot.feeGrowthOutside1X128 = ZERO_BI;
    tickSnapshot.save();
  }
  return tickSnapshot;
}
