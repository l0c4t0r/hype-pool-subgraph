import { HypeAdded } from "../../../generated/HypeRegistry/HypeRegistry";
import { processHypeAdded } from "../common/hypeRegistry";
import { processPoolQueue } from "../../helpers/pool";

export function handleHypeAdded(event: HypeAdded): void {
  processPoolQueue(event.block.number);
  processHypeAdded(event.params.hype, event.block);
}
