import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Token, _PoolPricing } from "../../generated/schema";
import { ADDRESS_ZERO, ONE_BD, ZERO_BD } from "./constants";
import { getOrCreatePool } from "./entities";
import { isUSDC } from "./token";

const USDC_DECIMAL_FACTOR = 10 ** 6;

export function getExchangeRate(
  poolAddress: Address,
  baseTokenIndex: i32
): BigDecimal {
  // Get ratios to convert token0 to token1 and vice versa
  const pool = getOrCreatePool(poolAddress);
  const sqrtPriceX96 = pool.sqrtPriceX96;
  const num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal();
  const Q192_BI = BigInt.fromI32(2).pow(192);
  const denom = new BigDecimal(Q192_BI);

  const token0 = Token.load(pool.token0)!
  const token1 = Token.load(pool.token1)!

  const decimal_factor = exponentToBigDecimal(token1.decimals - token0.decimals)

  let price = ZERO_BD;
  if (baseTokenIndex == 0 && num > ZERO_BD) {
    price = denom.times(decimal_factor).div(num); // This is rate of token1 in token0
  } else if (baseTokenIndex == 1) {
    price = num.div(denom).div(decimal_factor); // This is rate of token0 in token1
  }
  return price;
}

export function getBaseTokenRateInUSDC(poolAddress: Address): BigDecimal {
  let rate = ZERO_BD;
  const pricing = _PoolPricing.load(poolAddress);
  if (pricing) {
    const baseTokenAddress = Address.fromBytes(pricing.baseToken);
    if (baseTokenAddress == Address.fromString(ADDRESS_ZERO)) {
      rate = ZERO_BD;
    } else if (isUSDC(baseTokenAddress)) {
      rate = ONE_BD;
    } else {
      rate = ONE_BD;
      for (let i = 0; i < pricing.usdPath.length; i++) {
        let intermediateRate = getExchangeRate(
          Address.fromString(pricing.usdPath[i]),
          pricing.usdPathIndex[i]
        );
        rate = rate.times(intermediateRate);
      }
    }
  }
  // After conversions the rate will always be in USDC, which has 6 decimals
  return rate;
}

export function exponentToBigDecimal(exp: i32): BigDecimal {
    let bd = BigDecimal.fromString("1");
    const ten = BigDecimal.fromString("10");
    for (let i = 0; i < abs(exp); i++) {
      bd = bd.times(ten);
    }
    if (exp < 0) {
      bd = ONE_BD.div(bd)
    }
    return bd;
  }