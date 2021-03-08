/**
 * Given two sets, calculate additions and removals required to construct the new set.
 * @param oldSet
 * @param newSet
 */
export function getAddedRemoved<T>(
  oldSet: Set<T>,
  newSet: Set<T>
): {
  added: Set<T>;
  removed: Set<T>;
} {
  const r = {
    added: new Set<T>(),
    removed: new Set<T>()
  };

  oldSet.forEach(x => {
    if (!newSet.has(x)) {
      r.removed.add(x);
    }
  });

  newSet.forEach(x => {
    if (!oldSet.has(x)) {
      r.added.add(x);
    }
  });

  return r;
}
