import { Address, BigInt, Bytes, dataSource } from "@graphprotocol/graph-ts";
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
  _FastSync,
  _PoolPricing,
} from "../../generated/schema";
import {
  ADDRESS_ZERO,
  BASE_POSITION,
  CURRENT_BLOCK,
  LIMIT_POSITION,
  LOWER_TICK,
  PREVIOUS_BLOCK,
  PROTOCOL_UNISWAP_V3,
  UPPER_TICK,
  VERSION,
  ZERO_BD,
  ZERO_BI,
} from "./constants";
import { createAlgebraPool } from "./algebra";
import { createUniswapV3Pool } from "./uniswapV3";
import { protocolLookup } from "./lookups";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./token";
import { BaseTokenDefinition } from "./baseTokenDefinition";
import { FAST_SYNC, FAST_SYNC_BLOCK } from "./config";
import { triagePoolForFastSync } from "./fastSync";

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load("0");
  if (!protocol) {
    protocol = new Protocol("0");
    let network = dataSource.network();
    if (network == "arbitrum-one") {
      network = "arbitrum";
    }
    let name = "uniswap";
    let underlyingProtocol = PROTOCOL_UNISWAP_V3;
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
    hypervisor.symbol = hypervisorContract.symbol();
    const poolAddress = hypervisorContract.pool();
    const pool = getOrCreatePool(poolAddress);
    hypervisor.pool = pool.id;

    hypervisor.totalSupply = ZERO_BI;
    hypervisor.tvl0 = ZERO_BI;
    hypervisor.tvl1 = ZERO_BI;
    hypervisor.tvlUSD = ZERO_BD;

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
    hypervisor.lastUpdatedBlock = ZERO_BI;
    hypervisor._previousTotalSupply = ZERO_BI;
    hypervisor._previousTvl0 = ZERO_BI;
    hypervisor._previousTvl1 = ZERO_BI;
    hypervisor._previousTvlUSD = ZERO_BD;

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
  let pool = Pool.load(poolAddress);
  if (!pool) {
    pool = createUniswapV3Pool(poolAddress);
    if (!pool) {
      pool = createAlgebraPool(poolAddress);
    }

    if (pool) {
      pool._hypervisors = [];
      pool._ticksActive = [];
      pool.pricing = poolAddress;
      pool.lastUpdatedBlock = ZERO_BI;
      pool.lastHypervisorRefreshTime = ZERO_BI;
      pool._previousTick = 0;
      pool._previousFeeGrowthGlobal0X128 = ZERO_BI;
      pool._previousFeeGrowthGlobal1X128 = ZERO_BI;
      pool.save();

      getOrCreatePoolPricing(
        poolAddress,
        Address.fromBytes(pool.token0),
        Address.fromBytes(pool.token1)
      );
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
    token.priceUSD = ZERO_BD;
    token.lastUpdatedBlock = ZERO_BI;
    token.lastUpdatedTimestamp = ZERO_BI;
    token._previousPriceUSD = ZERO_BD;
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
    feeCollectionSnapshot.price0 = ZERO_BD;
    feeCollectionSnapshot.price1 = ZERO_BD;
    feeCollectionSnapshot.totalSupply = ZERO_BI;
    feeCollectionSnapshot.tvl0 = ZERO_BI;
    feeCollectionSnapshot.tvl1 = ZERO_BI;
    feeCollectionSnapshot.tvlUSD = ZERO_BD;
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

export function getOrCreatePoolPricing(
  poolAddress: Address,
  token0Address: Address,
  token1Address: Address
): _PoolPricing {
  let pricing = _PoolPricing.load(poolAddress);

  if (!pricing) {
    pricing = new _PoolPricing(poolAddress);

    let baseTokenLookup = BaseTokenDefinition.network(dataSource.network());
    let token0Lookup = baseTokenLookup.get(token0Address.toHex());
    if (token0Lookup == null) {
      token0Lookup = BaseTokenDefinition.nonBase();
    }
    let token1Lookup = baseTokenLookup.get(token1Address.toHex());
    if (token1Lookup == null) {
      token1Lookup = BaseTokenDefinition.nonBase();
    }

    // Reference arrays are in reverse order of priority. i.e. larger index take precedence
    if (token0Lookup.priority > token1Lookup.priority) {
      // token0 is the base token
      pricing.baseToken = token0Address;
      pricing.baseTokenIndex = 0;
      pricing.usdPath = token0Lookup.path;
      pricing.usdPathIndex = token0Lookup.pathIdx;
    } else if (token1Lookup.priority > token0Lookup.priority) {
      // token1 is the base token
      pricing.baseToken = token1Address;
      pricing.baseTokenIndex = 1;
      pricing.usdPath = token1Lookup.path;
      pricing.usdPathIndex = token1Lookup.pathIdx;
    } else {
      // This means token0 == token1 == -1, unidentified base token
      pricing.baseToken = Bytes.fromHexString(ADDRESS_ZERO);
      pricing.baseTokenIndex = -1;
      pricing.usdPath = [ADDRESS_ZERO];
      pricing.usdPathIndex = [-1];
    }
    pricing.priceTokenInBase = ZERO_BD;
    pricing.priceBaseInUSD = ZERO_BD;
    pricing.save();

    for (let i = 0; i < pricing.usdPath.length; i++) {
      if (pricing.usdPath[i] != ADDRESS_ZERO) {
        let pathPoolAddress = Address.fromString(pricing.usdPath[i]);
        let pool = Pool.load(pathPoolAddress);
        if (!pool) {
          pool = getOrCreatePool(pathPoolAddress);
          triagePoolForFastSync(pathPoolAddress);
        }
      }
    }
  }
  return pricing;
}

export function getOrCreateFastSync(): _FastSync {
  let fastSync = _FastSync.load("0");
  if (!fastSync) {
    fastSync = new _FastSync("0");
    fastSync.activated = FAST_SYNC;
    fastSync.syncBlock = FAST_SYNC ? FAST_SYNC_BLOCK : ZERO_BI;
    fastSync.pools = [];
    fastSync.poolsInitialized = false;
    fastSync.save();
  }
  return fastSync;
}
