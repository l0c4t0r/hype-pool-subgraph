import { BigInt } from "@graphprotocol/graph-ts"
import { ZERO_BI } from "./constants"

export const FAST_SYNC = false
export const FAST_SYNC_BLOCK = ZERO_BI
// export const FAST_SYNC_BLOCK = BigInt.fromString("109253960")  // Uniswap Arbitrum
// export const FAST_SYNC_BLOCK = BigInt.fromString("16668033")  // Uniswap Mainnet
// export const FAST_SYNC_BLOCK = BigInt.fromString("75503559")  // Uniswap Optimism
// export const FAST_SYNC_BLOCK = BigInt.fromString("54000000")  // Uniswap Polygon
// export const FAST_SYNC_BLOCK = BigInt.fromString("39499913")  // Quickswap Polygon
// export const FAST_SYNC_BLOCK = BigInt.fromString("188486050")
