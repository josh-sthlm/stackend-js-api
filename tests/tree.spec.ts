
import { newTree, addNode, newTreeNode } from '../api/tree'


describe('Tree', () => {

  describe("newTree", () => {
    it("Create a tree", () => {
      const t = newTree('Tree');
      expect(t).toBeDefined();
      expect(t.name).toBe("Tree");
      expect(t.permalink).toBe("tree");
      expect(t.id).toBe(0);
      expect(t.totalChildNodes).toBe(0);
      expect(t.children).toBeDefined();
      expect(t.children.length).toBe(0);
      expect(t.referenceId).toBe(0);
      expect(t.data).toBeDefined();
      expect(t.ref).toBeNull();
    })
  });

  describe("newTreeNode", () => {
    it("Creates a new tree node", () => {
      const n = newTreeNode("Node");
      expect(n).toBeDefined();
      expect(n.name).toBe("Node");
      expect(n.permalink).toBe("node");
      expect(n.referenceId).toBe(0);
      expect(n.children.length).toBe(0);
      expect(n.ref).toBeNull();
      expect(n.referenceId).toBe(0);
      expect(n.data).toBeDefined();
    });
  });

  describe("addNode", () => {
    it("Add a node to the tree", () => {
      const t = newTree('Tree');
      const n = newTreeNode('Node');

      addNode(t, n);
      expect(t.children.length).toBe(1);
    })
  });

});
