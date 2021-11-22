import { templateReplace, templateReplaceUrl } from '../src/api/templateReplace';

describe('template', () => {
  describe('templateReplace', () => {
    it('Does string substitution ', () => {
      expect(
        templateReplace('Hello {{name}}, how are you?', {
          name: 'World',
          extra: 'Wow'
        })
      ).toBe('Hello World, how are you?');

      expect(
        templateReplace('{{a}}, {{b}}, {{noValue}}, {{c}}', {
          a: 'a',
          b: 'b',
          c: 'c'
        })
      ).toBe('a, b, , c');
    });
  });

  describe('templateReplaceUrl', () => {
    it('Url string substitution', () => {
      expect(templateReplaceUrl('/path?a={{a}}', { a: 'apan ola', b: 'bosse' })).toBe('/path?a=apan%20ola');
    });
  });
});
