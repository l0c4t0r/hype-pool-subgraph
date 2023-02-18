import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { _PoolPricing } from "../../generated/schema";
import { getOrCreatePool, getOrCreateProtocol } from "./entities";
import { updateTvl } from "./hypervisor";
import { getBaseTokenRateInUSDC, getExchangeRate } from "./pricing";
import { updateTokenPrice } from "./token";

const hypervisorUpdateIntervalSeconds = BigInt.fromI32(600);

export function encodeKey(
  ownerAddress: Address,
  tickLower: i32,
  tickUpper: i32
): Bytes {
  const tupleArray: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(ownerAddress),
    ethereum.Value.fromI32(tickLower),
    ethereum.Value.fromI32(tickUpper),
  ];
  const tuple = changetype<ethereum.Tuple>(tupleArray);

  const encoded = ethereum.encode(ethereum.Value.fromTuple(tuple)) as Bytes;

  return encoded;
}

export function updatePoolPricing(
  poolAddress: Address,
  tickIdx: i32,
  sqrtPriceX96: BigInt,
  block: ethereum.Block
): void {
  const pool = getOrCreatePool(poolAddress);
  pool.currentTick = tickIdx;
  pool.sqrtPriceX96 = sqrtPriceX96;
  pool.save();

  const pricing = _PoolPricing.load(poolAddress)!;
  const price = getExchangeRate(poolAddress, pricing.baseTokenIndex);
  const baseTokenInUSDC = getBaseTokenRateInUSDC(poolAddress);

  pricing.priceTokenInBase = price;
  pricing.priceBaseInUSD = baseTokenInUSDC;
  pricing.save();

  // Also update prices on token
  const token0Address = Address.fromBytes(pool.token0);
  const token1Address = Address.fromBytes(pool.token1);

  if (pricing.baseTokenIndex == 0) {
    updateTokenPrice(token0Address, baseTokenInUSDC, block);
    updateTokenPrice(token1Address, baseTokenInUSDC.times(price), block);
  } else if (pricing.baseTokenIndex == 1) {
    updateTokenPrice(token0Address, baseTokenInUSDC.times(price), block);
    updateTokenPrice(token1Address, baseTokenInUSDC, block);
  }
}

export function updateHypervisorList(
  poolAddress: Address,
  hypervisorAddress: Address
): void {
  const pool = getOrCreatePool(poolAddress);
  const hypervisorList = pool._hypervisors;
  if (!hypervisorList.includes(hypervisorAddress.toHex())) {
    hypervisorList.push(hypervisorAddress.toHex());
    pool._hypervisors = hypervisorList;
    pool.save();
  }
}

export function updateLinkedHypervisorTvl(
  poolAddress: Address,
  block: ethereum.Block,
  force: boolean = false
): void {
  const pool = getOrCreatePool(poolAddress);
  const elapsedSinceLastHypervisorRefresh = block.timestamp.minus(
    pool.lastHypervisorRefreshTime
  );
  if (
    elapsedSinceLastHypervisorRefresh > hypervisorUpdateIntervalSeconds ||
    force
  ) {
    log.info(
      "{} seconds since last hypervisor refresh for pool {}.  Refreshing now",
      [elapsedSinceLastHypervisorRefresh.toString(), pool.id.toHex()]
    );
    const hypervisorList = pool._hypervisors;
    for (let i = 0; i < hypervisorList.length; i++) {
      updateTvl(Address.fromString(hypervisorList[i]), block.number);
    }
    pool.lastHypervisorRefreshTime = block.timestamp;
    pool.save();
  }
}

export function poolMatchesUnderlyingProtocol(poolAddress: Address): boolean {
  const protocol = getOrCreateProtocol();
  const pool = getOrCreatePool(poolAddress);
  return pool._protocol == protocol.underlyingProtocol;
}
