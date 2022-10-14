import { OTP } from '../src/shop/shopify-app';

describe('Shopify app ', () => {
  describe('OTP', () => {
    const otp = new OTP('apa');

    it('Get minute', async () => {
      const t1 = otp.getMinute();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const t2 = otp.getMinute();
      expect(t2 - t1).toBeLessThan(2);
    });

    it('Generate', async () => {
      // Generated OTP must match backend
      const p = await otp.generate('test@stackend.com', 1, 27762222);
      expect(p).toBe('c8bb1464ea8e578abc662a88901607d3d21d3a8936f5728bed61a20a15957087');
    });

    it('Verify', async () => {
      const minute = otp.getMinute();
      const o1 = await otp.generate('test@stackend.com', 1, minute);
      expect(await otp.verify('test@stackend.com', 1, o1)).toBeTruthy();

      const o2 = await otp.generate('test@stackend.com', 1, minute - 1);
      expect(await otp.verify('test@stackend.com', 1, o2)).toBeTruthy();

      const o3 = await otp.generate('test@stackend.com', 1, minute - 2);
      expect(await otp.verify('test@stackend.com', 1, o3)).toBeTruthy();

      // Expired
      const o4 = await otp.generate('test@stackend.com', 1, minute - 5);
      expect(await otp.verify('test@stackend.com', 1, o4)).toBeFalsy();
    });
  });
});
