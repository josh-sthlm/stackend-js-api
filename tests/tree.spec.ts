import { addNode, getTreeNodeByPermalink, InsertionPoint, moveTreeNode, newTree, newTreeNode } from '../src/api/tree';

describe('Tree', () => {
  describe('newTree', () => {
    it('Create a tree', () => {
      const t = newTree('Tree');
      expect(t).toBeDefined();
      expect(t.name).toBe('Tree');
      expect(t.permalink).toBe('tree');
      expect(t.id).toBe(0);
      expect(t.totalChildNodes).toBe(0);
      expect(t.children).toBeDefined();
      expect(t.children.length).toBe(0);
      expect(t.referenceId).toBe(0);
      expect(t.data).toBeDefined();
      expect(t.ref).toBeNull();
    });
  });

  describe('newTreeNode', () => {
    it('Creates a new tree node', () => {
      const n = newTreeNode('Node');
      expect(n).toBeDefined();
      expect(n.name).toBe('Node');
      expect(n.permalink).toBe('node');
      expect(n.referenceId).toBe(0);
      expect(n.children.length).toBe(0);
      expect(n.ref).toBeNull();
      expect(n.referenceId).toBe(0);
      expect(n.data).toBeDefined();
    });
  });

  describe('addNode', () => {
    it('Add a node to the tree', () => {
      const t = newTree('Tree');
      const n = newTreeNode('Node');

      addNode(t, n);
      expect(t.children.length).toBe(1);
    });
  });

  describe('moveTreeNode', () => {
    const t = newTree('Tree');
    const n1 = newTreeNode('Node 1');
    const n2 = newTreeNode('Node 2');
    addNode(t, n1);
    addNode(t, n2);
    expect(t.children.length).toBe(2);
    expect(t.children).toStrictEqual([n1, n2]);

    it('Move a tree node InsertionPoint.BEFORE', () => {
      moveTreeNode(t, n2, InsertionPoint.BEFORE, n1);
      expect(t.children.length).toBe(2);
      expect(t.children).toStrictEqual([n2, n1]);

      /* Should cause no change
      moveTreeNode(t, n2, InsertionPoint.BEFORE, n2);
      console.log(t);
      expect(t.children.length).toBe(2);
      expect(t.children).toStrictEqual([n2, n1]);
       */
    });

    it('Move a tree node InsertionPoint.AFTER', () => {
      moveTreeNode(t, n2, InsertionPoint.AFTER, n1);
      expect(t.children.length).toBe(2);
      expect(t.children).toStrictEqual([n1, n2]);

      // Should be able to repeat
      moveTreeNode(t, n2, InsertionPoint.AFTER, n1);
      expect(t.children.length).toBe(2);
      expect(t.children).toStrictEqual([n1, n2]);
    });

    it('Move a tree node InsertionPoint.CHILD', () => {
      moveTreeNode(t, n2, InsertionPoint.CHILD, n1);
      expect(t.children.length).toBe(1);
      expect(t.children).toStrictEqual([n1]);
      expect(t.children[0].children).toStrictEqual([n2]);
    });
  });

  describe('getTreeNodeByPermalink', () => {
    const t = newTree('Tree');
    const n1 = newTreeNode('Node 1');
    const n2 = newTreeNode('Node 2');
    const n3 = newTreeNode('Node 3');
    addNode(t, n1);
    addNode(t, n2);
    addNode(t, n3);
    moveTreeNode(t, n3, InsertionPoint.CHILD, n2);

    expect(getTreeNodeByPermalink(t, null)).toBeNull();
    expect(getTreeNodeByPermalink(t, '')).toBeNull();
    expect(getTreeNodeByPermalink(t, 'node-x')).toBeNull();

    expect(getTreeNodeByPermalink(t, 'node-1') === n1).toBeTruthy();
    expect(getTreeNodeByPermalink(t, '/node-1/') === n1).toBeTruthy();
    expect(getTreeNodeByPermalink(t, 'node-2') === n2).toBeTruthy();

    expect(getTreeNodeByPermalink(t, 'node-2/node-3') === n3).toBeTruthy();
    expect(getTreeNodeByPermalink(t, 'node-2/node-5')).toBeNull();
  });
});
