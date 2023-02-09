import { Address, dataSource } from "@graphprotocol/graph-ts";
import { Hypervisor as HypervisorContract } from "../../generated/HypeRegistry/Hypervisor";
import {
  Hypervisor,
  HypervisorPosition,
  Pool,
  Protocol,
  Tick,
} from "../../generated/schema";
import { BASE_POSITION, LIMIT_POSITION, VERSION, ZERO_BI } from "./constants";
import { createAlgebraPool } from "./algebra";
import { createUniswapV3Pool } from "./uniswapV3";
import { protocolLookup } from "./lookups";

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
    tick.save();
  }
  return tick;
}
