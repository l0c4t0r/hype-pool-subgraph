import {
  HypeAdded,
  HypeRemoved,
} from "../../../generated/HypeRegistry/HypeRegistry";
import { processPoolQueue } from "../../helpers/pool";
import { processHypeAdded, processHypeRemoved } from "../common/hypeRegistry";

export function handleHypeAdded(event: HypeAdded): void {
  processPoolQueue(event.block.number);
  processHypeAdded(event.params.hype, event.block);
}

export function handleHypeRemoved(event: HypeRemoved): void {
  processHypeRemoved(event.params.hype);
}
