import {
  Burn,
  Flash,
  Mint,
  Swap,
} from "../../../generated/templates/Pool/AlgebraIntegralPool";
import { poolMatchesUnderlyingProtocol } from "../../helpers/pool";
import { processBurn, processMint, processSwap } from "../common/pool";
import { updateProtocolFeeGrowthGlobal } from "../../helpers/common";
import { PROTOCOL_ALGEBRA_INTEGRAL } from "../../config/constants";
import { getOrCreateProtocol } from "../../helpers/entities";

export function handleMint(event: Mint): void {
  processMint(
    event.address,
    event.params.bottomTick,
    event.params.topTick,
    event.block.number
  );
}

export function handleBurn(event: Burn): void {
  processBurn(
    event.address,
    event.params.bottomTick,
    event.params.topTick,
    event.block.number
  );
}

export function handleSwap(event: Swap): void {
  processSwap(
    event.address,
    event.params.tick,
    event.params.price,
    event.block,
    getOrCreateProtocol()
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
    PROTOCOL_ALGEBRA_INTEGRAL
  );
}
