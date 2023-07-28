import {
  Address,
  BigInt,
  Bytes,
  ByteArray,
  crypto,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { ZERO_BI } from "../config/constants";

export function encodeKey(
  ownerAddress: Address,
  index: BigInt,
  tickLower: i32,
  tickUpper: i32
): Bytes {
  const tupleArray: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(ownerAddress),
    ethereum.Value.fromUnsignedBigInt(index),
    ethereum.Value.fromI32(tickLower),
    ethereum.Value.fromI32(tickUpper),
  ];
  const tuple = changetype<ethereum.Tuple>(tupleArray);

  const encoded = ethereum.encode(ethereum.Value.fromTuple(tuple)) as Bytes;

  return encoded;
}

export function ramsesPositionKey(
  ownerAddress: Address,
  tickLower: i32,
  tickUpper: i32
): Bytes {
  const encodedHex = encodeKey(
    ownerAddress,
    ZERO_BI,
    tickLower,
    tickUpper
  ).toHex();
  const encodedPacked =
    "0x" +
    encodedHex.substr(26, 40) +
    encodedHex.substr(66, 64) +
    encodedHex.substr(188, 6) +
    encodedHex.substr(252, 6);

  const keyArray = crypto.keccak256(ByteArray.fromHexString(encodedPacked));
  const key = Bytes.fromByteArray(keyArray);

  return key as Bytes;
}
