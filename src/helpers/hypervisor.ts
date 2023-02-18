import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Hypervisor as HypervisorContract } from "../../generated/HypeRegistry/Hypervisor";
import {
  getOrCreateHypervisor,
  getOrCreatePool,
  getOrCreateToken,
} from "./entities";
import { exponentToBigDecimal } from "./pricing";

export function updateTvl(
  hypervisorAddress: Address,
  blockNumber: BigInt
): void {
  const hypervisor = getOrCreateHypervisor(hypervisorAddress);

  if (blockNumber <= hypervisor.lastUpdatedBlock) {
    return;
  }

  const hypervisorContract = HypervisorContract.bind(hypervisorAddress);
  const totalAmounts = hypervisorContract.getTotalAmounts();

  hypervisor._previousTvl0 = hypervisor.tvl0;
  hypervisor._previousTvl1 = hypervisor.tvl1;
  hypervisor._previousTvlUSD = hypervisor.tvlUSD;

  hypervisor.tvl0 = totalAmounts.getTotal0();
  hypervisor.tvl1 = totalAmounts.getTotal1();

  const pool = getOrCreatePool(Address.fromBytes(hypervisor.pool));
  const token0 = getOrCreateToken(Address.fromBytes(pool.token0));
  const token1 = getOrCreateToken(Address.fromBytes(pool.token1));

  const tvl0USD = hypervisor.tvl0
    .toBigDecimal()
    .times(token0.priceUSD)
    .div(exponentToBigDecimal(token0.decimals));
  const tvl1USD = hypervisor.tvl1
    .toBigDecimal()
    .times(token1.priceUSD)
    .div(exponentToBigDecimal(token1.decimals));
  hypervisor.tvlUSD = tvl0USD.plus(tvl1USD);

  hypervisor.lastUpdatedBlock = blockNumber;
  hypervisor.save();
}
