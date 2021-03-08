import { ReferenceAble } from "../api";
import { XcapObject } from "../api";
import { ReferenceIdAware } from "../api";

/**
 * Get ids of all objects
 * @param objects
 * @returns {Set<string>}
 */
export function getIds(objects: Array<XcapObject>): Set<number> {
  const s = new Set<number>();
  if (!objects) {
    return s;
  }
  objects.forEach(r => {
    s.add(r.id);
  });

  return s;
}

/**
 * Get all obfuscated references
 * @param objects
 */
export function getObfuscatedReferences(objects: Array<ReferenceAble>): Set<string> {
  const s = new Set<string>();
  if (!objects) {
    return s;
  }

  objects.forEach(r => {
    s.add(r.obfuscatedReference);
  });

  return s;
}

/**
 * Get reference ids of all objects
 * @param objects
 * @returns {Set<number>}
 */
export function getReferenceIds(objects: Array<ReferenceIdAware>): Set<number> {
  const s = new Set<number>();
  if (!objects) {
    return s;
  }

  objects.forEach(r => {
    s.add(r.referenceId);
  });

  return s;
}
