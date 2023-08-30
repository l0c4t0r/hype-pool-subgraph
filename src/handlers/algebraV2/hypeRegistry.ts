import { HypeAdded } from "../../../generated/HypeRegistry/HypeRegistry";
import { processPoolQueue } from "../../helpers/pool";
import { processHypeAdded } from "../common/hypeRegistry";

export function handleHypeAdded(event: HypeAdded): void {
  processPoolQueue(event.block.number);
  processHypeAdded(event.params.hype, event.block);
}
