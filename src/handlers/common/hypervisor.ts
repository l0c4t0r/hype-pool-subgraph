import { Address, ethereum } from "@graphprotocol/graph-ts";
import { updateProtocolPoolPositionFees } from "../../helpers/common";
import { BASE_POSITION, LIMIT_POSITION } from "../../helpers/constants";
import { getOrCreateProtocol } from "../../helpers/entities";
import { updateTvl } from "../../helpers/hypervisor";
import {
  updateSnapshotCurrentBlock,
  updateSnapshotPreviousBlock,
} from "../../helpers/snapshots";

export function processZeroBurn(
  hypervisorAddress: Address,
  block: ethereum.Block
): void {
  updateSnapshotPreviousBlock(hypervisorAddress, block.number, block.timestamp);
  const protocol = getOrCreateProtocol();

  updateProtocolPoolPositionFees(
    hypervisorAddress,
    BASE_POSITION,
    block.number,
    protocol.underlyingProtocol,
    false
  );
  updateProtocolPoolPositionFees(
    hypervisorAddress,
    LIMIT_POSITION,
    block.number,
    protocol.underlyingProtocol,
    false
  );

  updateTvl(hypervisorAddress, block.number);
  updateSnapshotCurrentBlock(hypervisorAddress, block.number, false);
}
