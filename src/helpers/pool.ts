import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { getOrCreatePool } from "./entities";

export function encodeKey(
  ownerAddress: Address,
  tickLower: i32,
  tickUpper: i32
): Bytes {
  const tupleArray: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(ownerAddress),
    ethereum.Value.fromI32(tickLower),
    ethereum.Value.fromI32(tickUpper),
  ];
  const tuple = changetype<ethereum.Tuple>(tupleArray);

  const encoded = ethereum.encode(ethereum.Value.fromTuple(tuple)) as Bytes;

  return encoded;
}

export function updatePoolTick(poolAddress: Address, tickIdx: i32): void {
  const pool = getOrCreatePool(poolAddress);
  pool.currentTick = tickIdx;
  pool.save();
}
