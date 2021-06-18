//@flow

import {
  ACCESS_TOKEN_SESSION_STORAGE_KEY,
  clearAccessToken,
  clearPersistentData,
  getAccessToken,
  getPersistentData,
  PERSISTENT_DATA_LOCAL_STORAGE_KEY,
  removePersistentData,
  setAccessToken,
  setPersistentData,
  updatePersistentData
} from '../src/api/AccessToken';

describe('AccessToken', () => {
  it('get/setAccessToken', async () => {
    expect(localStorage).toBeDefined();

    expect(getAccessToken()).toBeUndefined();

    let c = Date.now();
    setAccessToken({
      id: 'abc123',
      created: c,
      ttl: 3600
    });

    console.log(sessionStorage.getItem(ACCESS_TOKEN_SESSION_STORAGE_KEY));

    expect(getAccessToken()).toStrictEqual({
      id: 'abc123',
      created: c,
      ttl: 3600
    });

    c = Date.now();
    setAccessToken({
      id: 'abcdef',
      created: c,
      ttl: 200
    });

    expect(getAccessToken()).toStrictEqual({
      id: 'abcdef',
      created: c,
      ttl: 200
    });

    setAccessToken(null);
    expect(getAccessToken()).toBeUndefined();

    setAccessToken({
      id: 'abcdef',
      created: c,
      ttl: 200
    });
    clearAccessToken();
    expect(getAccessToken()).toBeUndefined();
  });

  it('get/setPersistentData', async () => {
    expect(getPersistentData()).toStrictEqual({});

    setPersistentData('apa', 'ola');
    setPersistentData('koko', true);
    expect(getPersistentData()).toStrictEqual({ apa: 'ola', koko: true });
    updatePersistentData({
      apa: 'korv',
      hello: 'world',
      ko: 123
    });
    removePersistentData('ko');

    console.log(localStorage.getItem(PERSISTENT_DATA_LOCAL_STORAGE_KEY));

    expect(getPersistentData()).toStrictEqual({
      apa: 'korv',
      hello: 'world',
      koko: true
    });

    expect(getPersistentData('apa')).toBe('korv');

    clearPersistentData();
    expect(getPersistentData()).toStrictEqual({});
  });
});
