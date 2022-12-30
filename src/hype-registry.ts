import { log } from "@graphprotocol/graph-ts";
import { HypeAdded } from "../generated/HypeRegistry/HypeRegistry";
import { Hypervisor as HypervisorContract } from "../generated/HypeRegistry/Hypervisor";
import { Pool as PoolTemplate } from "../generated/templates";
import { Hypervisor } from "../generated/schema";
import { getOrCreatePool } from "./helpers/entities";

export function handleHypeAdded(event: HypeAdded): void {
  let hypervisor = Hypervisor.load(event.params.hype);

  if (!hypervisor) {
    hypervisor = new Hypervisor(event.params.hype);

    let hypervisorContract = HypervisorContract.bind(event.params.hype);
    let test_amount = hypervisorContract.try_getTotalAmounts();
    if (test_amount.reverted) {
      log.warning("Could not add {}, does not appear to be a hypervisor", [
        event.params.hype.toHex(),
      ]);
      return;
    }

    const poolAddress = hypervisorContract.pool();
    getOrCreatePool(poolAddress);

    hypervisor.pool = poolAddress;
    hypervisor.save();

    PoolTemplate.create(poolAddress);
  }
}
