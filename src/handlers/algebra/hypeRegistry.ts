import { Address, log } from "@graphprotocol/graph-ts";
import { HypeAdded } from "../../../generated/HypeRegistry/HypeRegistry";
import { Hypervisor as HypervisorContract } from "../../../generated/HypeRegistry/Hypervisor";
import { AlgebraPool as PoolContract } from "../../../generated/HypeRegistry/AlgebraPool";
import {
  Pool as PoolTemplate,
  Hypervisor as HypervisorTemplate,
} from "../../../generated/templates";
import { Hypervisor } from "../../../generated/schema";
import {
  getOrCreateHypervisor,
  getOrCreateProtocol,
} from "../../helpers/entities";
import { updateHypervisorRanges } from "../../helpers/feeGrowth";
import { BASE_POSITION, LIMIT_POSITION } from "../../helpers/constants";

export function handleHypeAdded(event: HypeAdded): void {
  let hypervisor = Hypervisor.load(event.params.hype);

  if (!hypervisor) {
    let hypervisorContract = HypervisorContract.bind(event.params.hype);
    let test_amount = hypervisorContract.try_getTotalAmounts();
    if (test_amount.reverted) {
      log.warning("Could not add {}, does not appear to be a hypervisor", [
        event.params.hype.toHex(),
      ]);
      return;
    }

    const poolContract = PoolContract.bind(hypervisorContract.pool());
    const test_globalState = poolContract.try_globalState();
    if (test_globalState.reverted) {
      log.warning(
        "Pool associated with {} does not appear to be a valid uniswap pool",
        [event.params.hype.toHex()]
      );
      return;
    }

    getOrCreateProtocol();
    hypervisor = getOrCreateHypervisor(event.params.hype);

    // Initialize ranges as hype may be added to registry after a rebalance
    updateHypervisorRanges(event.params.hype, BASE_POSITION, event.block.number)
    updateHypervisorRanges(event.params.hype, LIMIT_POSITION, event.block.number)

    HypervisorTemplate.create(event.params.hype);
    PoolTemplate.create(Address.fromBytes(hypervisor.pool));
  }
}
