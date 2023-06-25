import { Upgraded } from "../../../generated/templates/Token/ERC20";
import { updateToken } from "../../helpers/entities";

export function handleUpgraded(event: Upgraded): void {
  updateToken(event.address);
}
