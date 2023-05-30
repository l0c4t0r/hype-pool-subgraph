import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import { Hypervisor, _FastSync } from "../../../generated/schema";
import { Hypervisor as HypervisorContract } from "../../../generated/templates/Hypervisor/Hypervisor";
import { Hypervisor as HypervisorTemplate } from "../../../generated/templates";
import { AlgebraV1Pool as AlgebraV1PoolContract } from "../../../generated/templates/Pool/AlgebraV1Pool";
import { AlgebraV2Pool as AlgebraV2PoolContract } from "../../../generated/templates/Pool/AlgebraV2Pool";
import { UniswapV3Pool as UniswapPoolContract } from "../../../generated/templates/Pool/UniswapV3Pool";
import {
  getOrCreateFastSync,
  getOrCreateHypervisor,
  getOrCreatePool,
  getOrCreateProtocol,
} from "../../helpers/entities";
import { updateHypervisorRanges } from "../../helpers/feeGrowth";
import { updateHypervisorList, updatePoolPricing } from "../../helpers/pool";
import {
  PROTOCOL_ALGEBRA_V1,
  PROTOCOL_ALGEBRA_V2,
} from "../../config/constants";
import { triagePoolForFastSync } from "../../helpers/fastSync";

export function processHypeAdded(
  hypervisorAddress: Address,
  block: ethereum.Block
): void {
  let hypervisor = Hypervisor.load(hypervisorAddress);

  if (!hypervisor) {
    let hypervisorContract = HypervisorContract.bind(hypervisorAddress);
    let test_amount = hypervisorContract.try_getTotalAmounts();
    if (test_amount.reverted) {
      log.warning("Could not add {}, does not appear to be a hypervisor", [
        hypervisorAddress.toHex(),
      ]);
      return;
    }

    const protocol = getOrCreateProtocol();
    if (protocol.underlyingProtocol == PROTOCOL_ALGEBRA_V1) {
      const algebraPoolContract = AlgebraV1PoolContract.bind(
        hypervisorContract.pool()
      );
      const test_globalState = algebraPoolContract.try_globalState();
      if (test_globalState.reverted) {
        log.warning(
          "Pool associated with {} does not appear to be a valid algebra V1 pool",
          [hypervisorAddress.toHex()]
        );
        return;
      }
    } else if (protocol.underlyingProtocol == PROTOCOL_ALGEBRA_V2) {
      const algebraPoolContract = AlgebraV2PoolContract.bind(
        hypervisorContract.pool()
      );
      const test_globalState = algebraPoolContract.try_globalState();
      if (test_globalState.reverted) {
        log.warning(
          "Pool associated with {} does not appear to be a valid algebra V2 pool",
          [hypervisorAddress.toHex()]
        );
        return;
      }
    } else {
      const uniswapPoolContract = UniswapPoolContract.bind(
        hypervisorContract.pool()
      );
      const test_slot0 = uniswapPoolContract.try_slot0();
      if (test_slot0.reverted) {
        log.warning(
          "Pool associated with {} does not appear to be a valid uniswap pool",
          [hypervisorAddress.toHex()]
        );
        return;
      }
    }

    hypervisor = getOrCreateHypervisor(hypervisorAddress);
    // Initialize pricing related to underlying pool
    const poolAddress = Address.fromBytes(hypervisor.pool);
    const pool = getOrCreatePool(poolAddress);
    updatePoolPricing(poolAddress, pool.currentTick, pool.sqrtPriceX96, block);

    updateHypervisorList(poolAddress, hypervisorAddress);

    // Initialize ranges as hype may be added to registry after a rebalance
    updateHypervisorRanges(
      hypervisorAddress,
      block.number,
      protocol.underlyingProtocol
    );

    HypervisorTemplate.create(hypervisorAddress);

    getOrCreateFastSync();

    // Creates pool template if ready
    triagePoolForFastSync(poolAddress);
  }
}
