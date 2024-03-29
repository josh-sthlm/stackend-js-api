/**
 * Get ids of all objects
 * @param objects
 * @returns {Set<string>}
 */
import XcapObject from '../api/XcapObject';
import ReferenceAble from '../api/ReferenceAble';
import ReferenceIdAware from '../api/ReferenceIdAware';

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
export function getReferenceIds<T extends XcapObject>(objects: Array<ReferenceIdAware<T>>): Set<number> {
  const s = new Set<number>();
  if (!objects) {
    return s;
  }

  objects.forEach(r => {
    s.add(r.referenceId);
  });

  return s;
}
