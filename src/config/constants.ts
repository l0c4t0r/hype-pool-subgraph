import { BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";

export const VERSION = "1.7.0";

export const PROTOCOL_ALGEBRA_V1 = "algebraV1";
export const PROTOCOL_ALGEBRA_V2 = "algebraV2";
export const PROTOCOL_ALGEBRA_INTEGRAL = "algebraIntegral";
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
    lookup.set("USDCe", "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8");
    lookup.set("USDC", "0xaf88d065e77c8cc2239327c5edb3a432268e5831");

    return lookup as TypedMap<string, string>;
  }

  static polygon(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDCe", "0x2791bca1f2de4661ed88a30c99a7a9449aa84174");
    lookup.set("USDC", "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359");

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

  static mantle(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9");
    lookup.set("USDT_MANTLE", "0x201eba5cc46d216ce6dc03f6a759e8e766e956ae");

    return lookup as TypedMap<string, string>;
  }

  static linea(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x176211869ca2b568f2a7d4ee941e073a821ee1ff");

    return lookup as TypedMap<string, string>;
  }

  static base(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca");

    return lookup as TypedMap<string, string>;
  }

  static rollux(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x368433cac2a0b8d76e64681a9835502a1f2a8a30");

    return lookup as TypedMap<string, string>;
  }

  static kava(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0xeb466342c4d449bc9f53a865d5cb90586f405215");

    return lookup as TypedMap<string, string>;
  }

  static metis(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0xea32a96608495e54156ae48931a7c20f0dcc1a21");

    return lookup as TypedMap<string, string>;
  }

  static manta(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0xb73603c5d87fa094b7314c74ace2e64d165016fb");

    return lookup as TypedMap<string, string>;
  }

  static opbnb(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x0000000000000000000000000000000000000000"); // No USDC on opBNB
    lookup.set("USDT_OPBNB", "0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3");

    return lookup as TypedMap<string, string>;
  }

  static gnosis(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83");

    return lookup as TypedMap<string, string>;
  }

  static astarZkEvm(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035");

    return lookup as TypedMap<string, string>;
  }

  static immutableZkEvm(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x6de8acc0d406837030ce4dd28e7c08c5a96a30d2");

    return lookup as TypedMap<string, string>;
  }

  static blast(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDB", "0x4300000000000000000000000000000000000003");

    return lookup as TypedMap<string, string>;
  }

  static scroll(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4");

    return lookup as TypedMap<string, string>;
  }

  static xlayer(): TypedMap<string, string> {
    let lookup = new TypedMap<string, string>();
    lookup.set("USDC", "0x74b7f16337b8972027f6196a17a631ac6de26d22");
    lookup.set("USDT_XLAYER", "0x1e4a5963abfd975d8c9021ce480b42188849d41d");

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
    } else if (network == "manta-pacific-mainnet") {
      mapping = this.mantle();
    } else if (network == "linea") {
      mapping = this.linea();
    } else if (network == "base") {
      mapping = this.base();
    } else if (network == "syscoin") {
      mapping = this.rollux();
    } else if (network == "kava-evm") {
      mapping = this.kava();
    } else if (network == "metis") {
      mapping = this.metis();
    } else if (network == "manta") {
      mapping = this.manta();
    } else if (network == "opbnb-mainnet") {
      mapping = this.opbnb();
    } else if (network == "gnosis") {
      mapping = this.gnosis();
    } else if (network == "astar-zkevm-mainnet") {
      mapping = this.astarZkEvm();
    } else if (network == "imtbl-zkevm") {
      mapping = this.immutableZkEvm();
    } else if (network == "blast-mainnet") {
      mapping = this.blast();
    } else if (network == "scroll") {
      mapping = this.scroll();
    } else if (network == "xlayer-mainnet") {
      mapping = this.xlayer();
    }

    return mapping as TypedMap<string, string>;
  }
}
