//@flow

import { type Reference, type XcapObject } from '../api.ts';
import { generatePermalink } from '../permalink.ts';

export const TREE_CLASS: string = 'se.josh.xcap.tree.impl.TreeImpl';

export type Node = {
	permalink: string,
	name: string,
	description: string,
	ref: ?Reference /** Referenced object */,
	referenceId: number /** Id of referenced object */,
	data: any /** user data */,
	children: Array<Node>
};

export type Tree = XcapObject &
	Node & {
		totalChildNodes: number
	};

/**
 * Create, but does not store a new tree
 */
export function newTree(name: string): Tree {
	return {
		__type: TREE_CLASS,
		id: 0,
		permalink: generatePermalink(name),
		name,
		description: '',
		ref: null,
		children: [],
		data: {}
	};
}

/**
 * Create, but does not store a new node
 */
export function newTreeNode(name: string): Node {
	return {
		name,
		permalink: generatePermalink(name),
		description: '',
		ref: null,
		children: [],
		data: {}
	};
}

/**
 * Clone a tree
 * @param tree
 * @returns {Node}
 */
export function cloneTree(tree: Tree): Tree {
	return cloneNode(tree);
}

/**
 * Clone a node
 * @param node
 * @returns {Node|*}
 */
export function cloneNode(node: Node): Node {
	if (node == null) {
		return node;
	}

	let children = [];
	for (let i = 0; i < node.children.length; i++) {
		let c: Node = node.children[i];
		children.push(cloneNode(c));
	}

	return Object.assign({}, node, { children });
}

/**
 * Remove a tree node
 * @param tree
 * @param node
 * @returns {boolean}
 */
export function removeTreeNode(tree: Tree, node: Node): ?Node {
	if (tree == null || node == null) {
		return false;
	}

	let r = _forEachNode(tree, [], (n: Node, parent: Node, parents: Array<Node>, i: number) => {
		if (n === node) {
			parent.children.splice(i, 1);
			return true;
		}
		return false;
	});

	return r === null ? null : r[r.length - 1];
}

export function removeTreeNodeByPermalink(tree: Tree, permalink: string): ?Node {
	if (tree == null || !permalink) {
		return false;
	}

	let r = _forEachNode(tree, [], (n: Node, parent: Node, parents: Array<Node>, i: number) => {
		let pl = getPermalink(parents, n);
		if (pl === permalink) {
			parent.children.splice(i, 1);
			return true;
		}
		return false;
	});

	return r == null ? null : r[r.length - 1];
}

export const InsertionPoint = {
	BEFORE: 'BEFORE',
	AFTER: 'AFTER',
	CHILD: 'CHILD'
};

export type InsertionPointType = $Values<InsertionPoint>;

/**
 * Move a tree node
 * @param tree
 * @param node
 * @param insertionPoint
 * @param relativeTo
 */
export function moveTreeNode(
	tree: Tree,
	node: Node,
	insertionPoint: InsertionPointType,
	relativeTo: Node
): boolean {
	console.assert(tree);
	console.assert(node);
	console.assert(insertionPoint);
	console.assert(relativeTo);

	removeTreeNode(tree, node);

	if (insertionPoint === InsertionPoint.CHILD) {
		relativeTo.children.push(node);
		makeNodePermalinksUnique(relativeTo.children);
	} // Before or after
	else {
		let parents = getTreePath(tree, relativeTo);
		let insertionParent = parents[parents.length - 2];

		let idx = insertionParent.children.findIndex(c => c === relativeTo);
		if (idx === -1) {
			return;
		}

		let i = insertionPoint === InsertionPoint.BEFORE ? idx : idx + 1;
		insertionParent.children.splice(i, 0, node);
		makeNodePermalinksUnique(insertionParent.children);
	}
}

export function addNode(tree: Tree, node: Node): Tree {
	if (!tree || !node) {
		return;
	}

	tree.children = tree.children.concat(node);
	makeNodePermalinksUnique(tree.children);
	return tree;
}

/**
 * Find a node that matches the test
 * @param tree
 * @param test
 * @returns {Node|null|?Node}
 */
export function findNode(tree: Tree, test: (node: Node) => boolean): ?Node {
	if (!tree) {
		return null;
	}

	for (let i = 0; i < tree.children.length; i++) {
		let n = tree.children[i];
		if (test(n)) {
			return n;
		}

		let f = findNode(n, test);
		if (f) {
			return f;
		}
	}

	return null;
}

/**
 * Get a node by it's permalink
 * @param tree
 * @param permalink
 */
export function getNode(tree: Tree, permalink: string): ?Node {
	let path = getNodePath(tree, permalink);

	if (!path) {
		return null;
	}

	return path[path.length - 1];
}

/**
 * Get the tree path to a node
 * @param tree
 * @param permalink
 * @returns {?Array<Node>}
 */
export function getNodePath(tree: Tree, permalink: string): ?Array<Node> {
	return _forEachNode(tree, [], (node: Node, parent: Node, parents: Array<Node>) => {
		return getPermalink(parents, node) === permalink;
	});
}

/**
 * Apply a function to each node
 * @param tree
 * @param apply A function to apply. Returning true will abort the processing
 * @return Path to the node where the iteration was aborted
 */
export function forEachNode(
	tree: Tree,
	apply: (node: Node, parent: Node, parents: Array<Node>, i: number) => boolean
): ?Array<Node> {
	if (!tree) {
		return null;
	}

	return _forEachNode(tree, [], apply);
}

function _forEachNode(
	node: Node,
	parents: Array<Node>,
	apply: (node: Node, parent: Node, parents: Array<Node>, i: number) => boolean
): ?Array<Node> {
	parents.push(node);

	for (let i = 0; i < node.children.length; i++) {
		let n = node.children[i];
		if (apply(n, node, parents, i)) {
			parents.push(n);
			return parents;
		}

		let r = _forEachNode(n, parents, apply);
		if (r) {
			return r;
		}
	}

	parents.pop();
	return null;
}

export function getTreePath(tree: Tree, node: Node): ?Array<Node> {
	if (!tree || !node) {
		return null;
	}
	return _forEachNode(tree, [], (n: Node) => node === n);
}

export function getTreePathMatch(
	tree: Tree,
	apply: (node: Node, parent: Node, parents: Array<Node>, i: number) => boolean
): ?Array<Node> {
	if (!tree) {
		return null;
	}

	return _forEachNode(tree, [], apply);
}

export function getPermalink(treePath: Array<Node>, node?: ?Node): string {
	let s = '';
	for (let i = 0; i < treePath.length; i++) {
		s += '/' + treePath[i].permalink;
	}

	if (node) {
		s += '/' + node.permalink;
	}

	return s;
}

/**
 * Check if the path is a sub path of ofPath
 * @param path
 * @param ofPath
 * @returns {boolean}
 */
export function isSubPath(path: Array<Node>, ofPath: Array<Node>): boolean {
	if (!path || !ofPath || path.length > ofPath.length) {
		return false;
	}

	for (let i = 0; i < path.length; i++) {
		if (ofPath[i].permalink !== path[i].permalink) {
			return false;
		}
	}

	return true;
}

function makeNodePermalinksUnique(children: Array<Node>): void {
	let pls: Set<string> = new Set();

	for (let i = 0; i < children.length; i++) {
		let n: Node = children[i];
		let pl = n.permalink || 'page';
		let x = pl;
		let j = 0;
		while (true) {
			if (!pls.has(x)) {
				n.permalink = x;
				break;
			}
			j++;
			x = pl + '-' + j;
		}
		pls.add(n.permalink);

		makeNodePermalinksUnique(n.children);
	}
}

/**
 * Get the tree part of the permalink
 * @param permalink
 * @returns {string|null}
 */
export function getTreePermalink(permalink: string): ?string {
	if (!permalink) {
		return null;
	}

	let pl = permalink;

	if (pl.startsWith('/')) {
		pl = pl.substring(1);
	}

	let i = pl.indexOf('/');
	if (i !== -1) {
		pl = pl.substring(0, i);
	}

	return pl;
}
