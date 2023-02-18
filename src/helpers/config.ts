import { BigInt } from "@graphprotocol/graph-ts"
import { ZERO_BI } from "./constants"

export const FAST_SYNC = false
export const FAST_SYNC_BLOCK = ZERO_BI
// export const FAST_SYNC_BLOCK = BigInt.fromString("60124408")  // Uniswap Arbitrum
// export const FAST_SYNC_BLOCK = BigInt.fromString("74224200")  // Uniswap Optimism
// export const FAST_SYNC_BLOCK = BigInt.fromString("39191810")  // Uniswap Polygon
// export const FAST_SYNC_BLOCK = BigInt.fromString("16609349")  // Uniswap Mainnet
// export const FAST_SYNC_BLOCK = BigInt.fromString("39191810")  // Quickswap Polygon
