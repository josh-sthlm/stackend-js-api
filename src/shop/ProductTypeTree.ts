import { GraphQLListNode } from '../util/graphql';

/**
 * A node in the product type tree
 */
export interface ProductTypeTreeNode {
  /**
   * Simple name
   */
  name: string;

  /**
   * Full name
   */
  productType: string;

  /**
   * Child nodes
   */
  children: Array<ProductTypeTreeNode>;
}

/**
 * A tree of product types
 */
export type ProductTypeTree = Array<ProductTypeTreeNode>;

/**
 * Construct a new product type tree node
 * @param productType
 */
export function newProductTypeTreeNode(productType: string): ProductTypeTreeNode {
  let name = productType;
  const i = name.lastIndexOf('/');
  if (i !== -1) {
    name = name.substring(i + 1);
  }

  return {
    productType,
    name,
    children: []
  };
}

/**
 * Get the parent product type
 * @param n
 */
export function getParentProductType(n: ProductTypeTreeNode | string): string | null {
  let pt: string;
  if (typeof n === 'object') {
    pt = n.productType;
  } else {
    pt = n;
  }

  const i = pt.lastIndexOf('/');
  if (i === -1) {
    return null;
  }

  return pt.substring(0, i);
}

/**
 * Is the product type a root type?
 * @param n
 */
export function isRoot(n: ProductTypeTreeNode): boolean {
  return n.productType.indexOf('/') === -1;
}

export function hasChildren(n: ProductTypeTreeNode): boolean {
  return n.children.length !== 0;
}

export function addNode(parent: ProductTypeTreeNode, node: ProductTypeTreeNode): void {
  if (parent && node) {
    parent.children.push(node);
  }
}

/**
 * Get all product types under a tree node as a flat list
 * @param p
 * @param result
 */
export function getAllProductTypes(p: ProductTypeTreeNode, result?: Array<string>): Array<string> {
  if (typeof result === 'undefined') {
    result = [];
  }

  result.push(p.productType);
  for (const c of p.children) {
    getAllProductTypes(c, result);
  }

  return result;
}

/**
 * Find a product type tree node given it's productType
 * @param t
 * @param productType
 */
export function findProductTypeTreeNode(
  t: ProductTypeTree | ProductTypeTreeNode,
  productType: string
): ProductTypeTreeNode | null {
  if (Array.isArray(t)) {
    for (const n of t) {
      const x = _findProductTypeTreeNode(n, productType);
      if (x) {
        return x;
      }
    }
  } else {
    return _findProductTypeTreeNode(t as ProductTypeTreeNode, productType);
  }

  return null;
}

function _findProductTypeTreeNode(n: ProductTypeTreeNode, productType: string): ProductTypeTreeNode | null {
  if (n.productType == productType) {
    return n;
  } else if (productType.startsWith(n.productType)) {
    for (const m of n.children) {
      const x = _findProductTypeTreeNode(m, productType);
      if (x) {
        return x;
      }
    }
  }

  return null;
}

/**
 * Create a product type tree from a flat list of product types
 * @param productTypes
 */
export function buildProductTypeTree(productTypes: Array<GraphQLListNode<string>>): ProductTypeTree {
  const pt: Array<string> = productTypes.map(n => n.node);
  const i = pt.indexOf('');
  if (i !== -1) {
    pt.splice(i, 1);
  }
  pt.sort((a, b) => a.localeCompare(b));

  const t: ProductTypeTree = [];
  const treeHash: { [productType: string]: ProductTypeTreeNode } = {};

  pt.forEach(x => {
    const n = newProductTypeTreeNode(x);
    treeHash[x] = n;

    const parent = getParentProductType(n);
    if (parent) {
      let pn = treeHash[parent];
      if (!pn) {
        pn = newProductTypeTreeNode(parent);
        treeHash[parent] = pn;
        if (isRoot(pn)) {
          t.push(pn);
        }
      }
      addNode(pn, n);
    } else {
      t.push(n);
    }
  });

  return t;
}
