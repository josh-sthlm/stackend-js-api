//@flow


import { generatePermalink } from '../src/permalink'


describe('Permalink', () => {

  describe("generatePermalink", () => {
    it("Generate a permalink", () => {

      expect(generatePermalink("")).toBeNull();
      expect(generatePermalink("A")).toBe("a");
      expect(generatePermalink("A B C")).toBe("a-b-c");
      expect(generatePermalink("A.B,C!D:E;F/G\\H")).toBe("a-b-c-d-e-f/gh");

    });
  });


});


