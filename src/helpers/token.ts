import {
  Address,
  BigDecimal,
  ethereum,
} from "@graphprotocol/graph-ts";
import { constantAddresses, DEFAULT_DECIMAL } from "../config/constants";
import { StaticTokenDefinition } from "../config/staticTokenDefinition";
import { ERC20 } from "../../generated/HypeRegistry/ERC20";
import { ERC20SymbolBytes } from "../../generated/HypeRegistry/ERC20SymbolBytes";
import { ERC20NameBytes } from "../../generated/HypeRegistry/ERC20NameBytes";
import { getOrCreateProtocol, getOrCreateToken } from "./entities";

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

  // try types string and bytes32 for symbol
  let symbolValue = "unknown";
  let symbolResult = contract.try_symbol();
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString();
      } else {
        // try with the static definition
        let staticTokenDefinition = StaticTokenDefinition.fromAddress(
          tokenAddress
        );
        if (staticTokenDefinition != null) {
          symbolValue = staticTokenDefinition.symbol;
        }
      }
    }
  } else {
    symbolValue = symbolResult.value;
  }

  return symbolValue;
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  // try types string and bytes32 for name
  let nameValue = "unknown";
  let nameResult = contract.try_name();
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      } else {
        // try with the static definition
        let staticTokenDefinition = StaticTokenDefinition.fromAddress(
          tokenAddress
        );
        if (staticTokenDefinition != null) {
          nameValue = staticTokenDefinition.name;
        }
      }
    }
  } else {
    nameValue = nameResult.value;
  }

  return nameValue;
}

export function fetchTokenDecimals(tokenAddress: Address): i32 {
  let contract = ERC20.bind(tokenAddress);
  // try types uint8 for decimals
  let decimalValue = DEFAULT_DECIMAL;
  let decimalResult = contract.try_decimals();
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value;
  } else {
    // try with the static definition
    let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress);
    if (staticTokenDefinition != null) {
      return staticTokenDefinition.decimals;
    }
  }

  return decimalValue as i32;
}

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

export function isUSDC(tokenAddress: Address): boolean {
  const protocol = getOrCreateProtocol()
  const addressLookup = constantAddresses.network(protocol.network);
  const usdcAddress = addressLookup.get("USDC") as string;
  const usdceAddress = addressLookup.get("USDCe")
  const usdtMantleAddress = addressLookup.get("USDT_MANTLE");
  const busdLineaAddress = addressLookup.get("BUSD_LINEA")

  if (tokenAddress == Address.fromString(usdcAddress)) {
    return true
  }

  if (usdceAddress) {
    if ( tokenAddress == Address.fromString(usdceAddress)) {
      return true
    }
  }

  if (usdtMantleAddress) {
    if (tokenAddress == Address.fromString(usdtMantleAddress)) {
      return true;
    }
  }

  if (busdLineaAddress) {
    if (tokenAddress == Address.fromString(busdLineaAddress)) {
      return true;
    }
  }

  return false
}

export function updateTokenPrice(
  tokenAddress: Address,
  price: BigDecimal,
  block: ethereum.Block
): void {
  const token = getOrCreateToken(tokenAddress);

  token._previousPriceUSD = token.priceUSD;
  token.priceUSD = price;
  token.lastUpdatedBlock = block.number;
  token.lastUpdatedTimestamp = block.timestamp;
  token.save();
}
