import { Address, log } from "@graphprotocol/graph-ts";
import { HypeAdded } from "../../../generated/HypeRegistry/HypeRegistry";
import { Hypervisor as HypervisorContract } from "../../../generated/HypeRegistry/Hypervisor";
import { UniswapV3Pool as PoolContract } from "../../../generated/HypeRegistry/UniswapV3Pool";
import {
  Pool as PoolTemplate,
  Hypervisor as HypervisorTemplate,
} from "../../../generated/templates";
import { Hypervisor } from "../../../generated/schema";
import {
  getOrCreateHypervisor,
  getOrCreateProtocol,
} from "../../helpers/entities";
import { updateHypervisorList } from "../../helpers/pool";

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
    const test_slot0 = poolContract.try_slot0();
    if (test_slot0.reverted) {
      log.warning(
        "Pool associated with {} does not appear to be a valid uniswap pool",
        [event.params.hype.toHex()]
      );
      return;
    }

    getOrCreateProtocol();
    hypervisor = getOrCreateHypervisor(event.params.hype);

    updateHypervisorList(Address.fromBytes(hypervisor.pool), event.params.hype)

    HypervisorTemplate.create(event.params.hype);
    PoolTemplate.create(Address.fromBytes(hypervisor.pool));
  }
}
