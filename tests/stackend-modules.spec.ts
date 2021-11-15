import {
  addModuleInfo,
  AUTOMATIC_MODULE_TYPES,
  getModuleInfo,
  ModuleType,
  removeModuleInfo
} from '../src/stackend/modules';
import assert from 'assert';
import createTestStore from './setup';
import { initialize } from '../src/api/actions';
import { STACKEND_COM_COMMUNITY_PERMALINK } from '../src/stackend';
import { GetInitialStoreValuesResult } from '../src/api';
import { ModuleState } from '../src/stackend/moduleReducer';

describe('Stackend modules', () => {
  const store = createTestStore();

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

  describe('Modules store', () => {
    it('Request modules', async () => {
      // Can't run fetchModules, since it requires auth

      const r: GetInitialStoreValuesResult = await store.dispatch(
        initialize({
          permalink: STACKEND_COM_COMMUNITY_PERMALINK,
          moduleIds: [190]
        })
      );

      expect(r.modules).toBeDefined();
      expect(r.modules[190]).toBeDefined();

      const modules: ModuleState = store.getState().modules;
      expect(modules.moduleIds).toBeDefined();
      expect(modules.modulesById).toBeDefined();
      expect(modules.modulesById['190']).toBeDefined();
      expect(modules.moduleIds.indexOf(190) !== 0).toBeTruthy();
    });
  });
});
