export function tickCrossed(
  testTick: i32,
  oldTick: i32,
  newTick: i32
): boolean {
  let tickBelow = 0;
  let tickAbove = 0;

  if (newTick > oldTick) {
    tickBelow = oldTick;
    tickAbove = newTick;
  } else if (oldTick > newTick) {
    tickBelow = newTick;
    tickAbove = oldTick;
  } else {
    return false; // tick unchanged, no updated needed
  }

  if (testTick >= tickBelow && testTick <= tickAbove) {
    return true;
  }
  return false;
}
