import { BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";

export const VERSION = "1.2.0";

export const PROTOCOL_ALGEBRA_V1 = "algebraV1";
export const PROTOCOL_ALGEBRA_V2 = "algebraV2";
export const PROTOCOL_UNISWAP_V3 = "uniswapV3";

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

  static bsc(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d");

    return lookup as TypedMap<string, string>;
  }

  static polygonZkEvm(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035");

    return lookup as TypedMap<string, string>;
  }

  static avalanche(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e");

    return lookup as TypedMap<string, string>;
  }

  static fantom(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x04068da6c83afcfa0e13ba15a6696662335d5b75");

    return lookup as TypedMap<string, string>;
  }

  static moonbeam(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x931715fee2d06333043d11f658c8ce934ac61d0c");

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
    } else if (network == "bsc") {
      mapping = this.bsc();
    } else if (network == "polygon-zkevm") {
      mapping = this.polygonZkEvm();
    } else if (network == "avalanche") {
      mapping = this.avalanche();
    } else if (network == "fantom") {
      mapping = this.fantom();
    } else if (network == "moonbeam") {
      mapping = this.moonbeam();
    }


    return mapping as TypedMap<string, string>;
  }
}
