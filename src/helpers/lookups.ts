import { TypedMap } from "@graphprotocol/graph-ts";

class protocolInfo {
  name: string;
  underlyingProtocol: string;
}

export const protocolLookup = new TypedMap<string, protocolInfo>();
protocolLookup.set("matic:0xaec731f69fa39ad84c7749e913e3bc227427adfd", {
  name: "quickswap",
  underlyingProtocol: "algebra",
});
protocolLookup.set("arbitrum-one:0x66cd859053c458688044d816117d5bdf42a56813", {
  name: "uniswap",
  underlyingProtocol: "uniswapV3",
});
