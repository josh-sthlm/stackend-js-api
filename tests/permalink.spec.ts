//@flow


import { generatePermalink, getParentPermalink } from '../src/api/permalink';


describe('Permalink', () => {

  describe("generatePermalink", () => {
    it("Generate a permalink", () => {

      expect(generatePermalink("")).toBeNull();
      expect(generatePermalink("A")).toBe("a");
      expect(generatePermalink("A B C")).toBe("a-b-c");
      expect(generatePermalink("A.B,C!D:E;F/G\\H")).toBe("a-b-c-d-e-f/gh");
      expect(generatePermalink("räksmörgås")).toBe("raksmorgas");

    });
  });

  describe("getParentPermalink", () => {
    it("Get a parent permalink", () => {
      expect(getParentPermalink('')).toBeNull();
      expect(getParentPermalink('apa')).toBeNull();
      expect(getParentPermalink('/apa/')).toBeNull();
      expect(getParentPermalink('/apa/ola')).toBe('/apa');
      expect(getParentPermalink('/apa/ola/')).toBe('/apa');
    })
  })

});


