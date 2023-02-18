import { Address, ethereum } from "@graphprotocol/graph-ts";
import { updateProtocolPoolPositionFees } from "../../helpers/common";
import { BASE_POSITION, LIMIT_POSITION } from "../../helpers/constants";
import {
  getOrCreateHypervisor,
  getOrCreateProtocol,
} from "../../helpers/entities";
import { updateTicks } from "../../helpers/feeGrowth";
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

  // Update ticks as well before snapshot
  const hypervisor = getOrCreateHypervisor(hypervisorAddress);
  updateTicks(
    Address.fromBytes(hypervisor.pool),
    block.number,
    protocol.underlyingProtocol,
    false
  );
  updateSnapshotCurrentBlock(hypervisorAddress, block.number, false);
}
