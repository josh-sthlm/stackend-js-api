import createTestStore from './setup';
import { requestCurrencyInfo, roundToMinimalFractionalUnit } from '../src/shop/currency';
import { RECEIVE_CURRENCY } from '../src/shop/shopReducer';

describe('Currency', () => {
  const store = createTestStore();
  store.dispatch(requestCurrencyInfo('SEK'));
  store.dispatch({
    type: RECEIVE_CURRENCY,
    currency: {
      code: 'XXX',
      name: 'Test',
      subunitToUnit: 100,
      smallestDenomination: 25
    }
  });

  describe('Currency', () => {
    it('roundToMinimalFractionalUnit', () => {
      const shop = store.getState().shop;

      // Round down
      expect(
        roundToMinimalFractionalUnit(shop, {
          amount: '12.34',
          currencyCode: 'SEK'
        })
      ).toStrictEqual({
        amount: '12',
        currencyCode: 'SEK'
      });

      // Round up
      expect(
        roundToMinimalFractionalUnit(shop, {
          amount: '34.56',
          currencyCode: 'SEK'
        })
      ).toStrictEqual({
        amount: '35',
        currencyCode: 'SEK'
      });

      expect(
        roundToMinimalFractionalUnit(shop, {
          amount: '12.34',
          currencyCode: 'XXX'
        })
      ).toStrictEqual({
        amount: '12.25',
        currencyCode: 'XXX'
      });

      expect(
        roundToMinimalFractionalUnit(shop, {
          amount: '23.45',
          currencyCode: 'XXX'
        })
      ).toStrictEqual({
        amount: '23.5',
        currencyCode: 'XXX'
      });

      expect(
        roundToMinimalFractionalUnit(shop, {
          amount: '1.75',
          currencyCode: 'XXX'
        })
      ).toStrictEqual({
        amount: '1.75',
        currencyCode: 'XXX'
      });

      expect(
        roundToMinimalFractionalUnit(shop, {
          amount: '1.76',
          currencyCode: 'XXX'
        })
      ).toStrictEqual({
        amount: '1.75',
        currencyCode: 'XXX'
      });
    });
  });
});
