import { TypedMap } from "@graphprotocol/graph-ts";
import { PROTOCOL_ALGEBRA, PROTOCOL_UNISWAP_V3 } from "./constants";

class protocolInfo {
  name: string;
  underlyingProtocol: string;
}

export const protocolLookup = new TypedMap<string, protocolInfo>();
protocolLookup.set("matic:0xaec731f69fa39ad84c7749e913e3bc227427adfd", {
  name: "quickswap",
  underlyingProtocol: PROTOCOL_ALGEBRA,
});
protocolLookup.set("arbitrum:0x66cd859053c458688044d816117d5bdf42a56813", {
  name: "uniswap",
  underlyingProtocol: PROTOCOL_UNISWAP_V3,
});
protocolLookup.set("arbitrum:0x37595fcaf29e4fbac0f7c1863e3df2fe6e2247e9", {
  name: "zyberswap",
  underlyingProtocol: PROTOCOL_ALGEBRA,
});
