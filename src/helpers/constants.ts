import { BigInt } from "@graphprotocol/graph-ts";

export const VERSION = "0.6.0";

export const BASE_POSITION = "base";
export const LIMIT_POSITION = "limit";

export const LOWER_TICK = "lower"
export const UPPER_TICK = "upper"

export const PREVIOUS_BLOCK = "previous"
export const CURRENT_BLOCK = "current"

export const ZERO_BI = BigInt.fromI32(0);
export const DEFAULT_DECIMAL = 18