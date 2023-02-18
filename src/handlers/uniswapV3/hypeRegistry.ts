import { HypeAdded } from "../../../generated/HypeRegistry/HypeRegistry";
import { processHypeAdded } from "../common/hypeRegistry";

export function handleHypeAdded(event: HypeAdded): void {
  processHypeAdded(event.params.hype, event.block.number);
}
