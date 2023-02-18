import { BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";

export const VERSION = "0.15.0";

export const PROTOCOL_ALGEBRA = "algebra"
export const PROTOCOL_UNISWAP_V3 = "uniswapV3"

export const BASE_POSITION = "base";
export const LIMIT_POSITION = "limit";

export const LOWER_TICK = "lower";
export const UPPER_TICK = "upper";

export const PREVIOUS_BLOCK = "previous";
export const CURRENT_BLOCK = "current";

export const ZERO_BI = BigInt.zero();
export const ZERO_BD = BigDecimal.zero();
export const ONE_BD = BigDecimal.fromString("1");
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const DEFAULT_DECIMAL = 18;

export class constantAddresses {
  static mainnet(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");

    return lookup as TypedMap<string, string>;
  }

  static arbitrum_one(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8");

    return lookup as TypedMap<string, string>;
  }

  static polygon(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x2791bca1f2de4661ed88a30c99a7a9449aa84174");

    return lookup as TypedMap<string, string>;
  }

  static optimism(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x7f5c764cbc14f9669b88837ca1490cca17c31607");

    return lookup as TypedMap<string, string>;
  }

  static celo(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x37f750b7cc259a2f741af45294f6a16572cf5cad");

    return lookup as TypedMap<string, string>;
  }

  static network(network: string): TypedMap<string, string> {
    let mapping = new TypedMap<string, string>();
    if (network == "mainnet") {
      mapping = this.mainnet();
    } else if (network == "matic") {
      mapping = this.polygon();
    } else if (network == "arbitrum-one") {
      mapping = this.arbitrum_one();
    } else if (network == "optimism") {
      mapping = this.optimism();
    } else if (network == "celo") {
      mapping = this.celo();
    }

    return mapping as TypedMap<string, string>;
  }
}
