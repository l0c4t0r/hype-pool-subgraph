import {
  Burn,
  Flash,
  Mint,
  Swap,
} from "../../../generated/templates/Pool/FusionxPool";
import { poolMatchesUnderlyingProtocol } from "../../helpers/pool";
import { processBurn, processMint, processSwap } from "../common/pool";
import { updateProtocolFeeGrowthGlobal } from "../../helpers/common";
import { PROTOCOL_UNISWAP_V3 } from "../../config/constants";
import { getOrCreateProtocol } from "../../helpers/entities";

export function handleMint(event: Mint): void {
  processMint(
    event.address,
    event.params.tickLower,
    event.params.tickUpper,
    event.block.number
  );
}

export function handleBurn(event: Burn): void {
  processBurn(
    event.address,
    event.params.tickLower,
    event.params.tickUpper,
    event.block.number
  );
}

export function handleSwap(event: Swap): void {
  const protocol = getOrCreateProtocol()
  processSwap(
    event.address,
    event.params.tick,
    event.params.sqrtPriceX96,
    event.block,
    protocol
  );
}

export function handleFlash(event: Flash): void {
  if (!poolMatchesUnderlyingProtocol(event.address)) {
    return;
  }
  // update globals, tick doesn't move for flash
  updateProtocolFeeGrowthGlobal(
    event.address,
    event.block.number,
    PROTOCOL_UNISWAP_V3
  );
}
