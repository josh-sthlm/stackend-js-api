import { Module } from '../src/stackend';
import { filterLiveEventModule, isLiveEventModule, LiveEventState, newLiveEventModule } from '../src/live';

describe('Live', () => {
  describe('Live', () => {
    const scheduled = createLiveEventModule('Scheduled', Date.now() + 24 * 60 * 60 * 1000, LiveEventState.SCHEDULED);
    const active = createLiveEventModule('Active', Date.now() - 60 * 1000, LiveEventState.ACTIVE);
    const completed = createLiveEventModule('Completed', Date.now() - 24 * 60 * 60 * 1000, LiveEventState.COMPLETED);
    const all = [scheduled, active, completed];

    it('isLiveEventModule', async () => {
      isLiveEventModule(scheduled);
    });

    it('filterLiveEventModules', async () => {
      const s = all.filter(m => filterLiveEventModule(m, LiveEventState.SCHEDULED));
      expect(s.length).toBe(1);
      expect(s[0]).toBe(scheduled);

      const a = all.filter(m => filterLiveEventModule(m, LiveEventState.ACTIVE));
      expect(a.length).toBe(1);
      expect(a[0]).toBe(active);

      const c = all.filter(m => filterLiveEventModule(m, LiveEventState.COMPLETED));
      expect(c.length).toBe(1);
      expect(c[0]).toBe(completed);
    });
  });
});

function createLiveEventModule(name: string, startDate: number, state: LiveEventState): Module {
  return newLiveEventModule({
    name,
    communityId: -1,
    settings: {
      startDate,
      state
    }
  });
}
