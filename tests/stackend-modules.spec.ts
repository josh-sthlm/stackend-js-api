//@flow

import {
  addModuleInfo,
  AUTOMATIC_MODULE_TYPES,
  getModuleInfo,
  ModuleType,
  removeModuleInfo
} from '../src/stackend/modules';
import assert from 'assert';

describe('Stackend modules', () => {
  describe('getModuleInfo', () => {
    it('Get info about a module', async () => {
      const i = getModuleInfo(ModuleType.FEED);
      assert(i);
      expect(i.type).toBe(ModuleType.FEED);
      expect(i.addAutomatically).toBe(false);
      expect(i.singleton).toBe(false);
      expect(i.simpleId).toBe(false);
      expect(i.xcapModuleType).toBe('group');
      expect(i.defaultContext).toBe('groups');
      expect(i.complex).toBe(false);
      expect(i.name).toBe('Feed');
    });
  });

  describe('add/removeModuleInfo', () => {
    it('Add / remove module', () => {
      const mt: ModuleType = 'stackend-test' as ModuleType;
      addModuleInfo({
        name: 'Test',
        complex: false,
        defaultContext: null,
        xcapModuleType: 'test',
        simpleId: true,
        singleton: false,
        addAutomatically: true,
        type: mt,
        fetchData: false,
        parameters: []
      });

      const m = getModuleInfo(mt);
      assert(m);
      expect(m.type).toBe(mt);
      expect(AUTOMATIC_MODULE_TYPES.indexOf(mt)).toBeGreaterThan(-1);

      removeModuleInfo(mt);
      const n = getModuleInfo(mt);
      expect(n).toBeNull();
      expect(AUTOMATIC_MODULE_TYPES.indexOf(mt)).toBe(-1);
    });
  });
});
