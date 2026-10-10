import "@testing-library/jest-dom/vitest";

/*
  happy-dom answers "" from Node.prototype's `nodeName` getter for elements and
  text (each subclass overrides it). DOMPurify reads `nodeName` through
  Node.prototype, so without this shim every node looks unknown and the
  sanitiser's output in tests means nothing. Browsers are unaffected.
*/
const baseNodeName = Object.getOwnPropertyDescriptor(Node.prototype, "nodeName");
if (baseNodeName?.get) {
  Object.defineProperty(Node.prototype, "nodeName", {
    ...baseNodeName,
    get(this: Node) {
      for (let p = Object.getPrototypeOf(this); p && p !== Node.prototype; p = Object.getPrototypeOf(p)) {
        const own = Object.getOwnPropertyDescriptor(p, "nodeName")?.get;
        if (own) return own.call(this);
      }
      return baseNodeName.get?.call(this);
    },
  });
}

/*
  happy-dom's NodeIterator loses its place when the node it just returned is
  removed (the DOM spec moves the reference to the preceding node). DOMPurify
  removes nodes mid-walk, so in tests it skipped whatever followed a removed
  element. This iterator follows the spec for that case; browsers have it built in.
*/
type Filter = NodeFilter | ((node: Node) => number) | null;
function following(node: Node, root: Node): Node | null {
  if (node.firstChild) return node.firstChild;
  for (let n: Node | null = node; n && n !== root; n = n.parentNode) {
    if (n.nextSibling) return n.nextSibling;
  }
  return null;
}
function preceding(node: Node, root: Node): Node | null {
  if (node === root) return null;
  let n = node.previousSibling;
  if (!n) return node.parentNode;
  while (n.lastChild) n = n.lastChild;
  return n;
}
function createNodeIterator(root: Node, whatToShow = 0xffffffff, filter: Filter = null): NodeIterator {
  const accepts = (node: Node) => {
    if (!((whatToShow >> (node.nodeType - 1)) & 1)) return false;
    if (!filter) return true;
    const verdict = typeof filter === "function" ? filter(node) : filter.acceptNode(node);
    return verdict === NodeFilter.FILTER_ACCEPT;
  };
  let reference: Node | null = null;
  let before: Node | null = null;
  return {
    root,
    whatToShow,
    filter,
    get referenceNode() {
      return reference ?? root;
    },
    pointerBeforeReferenceNode: false,
    detach() {},
    previousNode() {
      throw new Error("previousNode is not implemented by the test shim");
    },
    nextNode() {
      let node: Node | null;
      if (reference === null) node = root;
      else {
        const base = root.contains(reference) ? reference : before && root.contains(before) ? before : null;
        node = base ? following(base, root) : null;
      }
      while (node && !accepts(node)) node = following(node, root);
      if (node) {
        reference = node;
        before = preceding(node, root);
      }
      return node;
    },
  } as unknown as NodeIterator;
}
// happy-dom gives parsed and template documents their own classes, so patch whichever
// prototype supplies createNodeIterator for each kind of document DOMPurify uses.
for (const doc of [
  document,
  document.createElement("template").content.ownerDocument,
  new DOMParser().parseFromString("", "text/html"),
  document.implementation.createHTMLDocument(""),
]) {
  let proto: object | null = doc;
  while (proto && !Object.prototype.hasOwnProperty.call(proto, "createNodeIterator")) proto = Object.getPrototypeOf(proto);
  if (proto) Object.defineProperty(proto, "createNodeIterator", { value: createNodeIterator, configurable: true, writable: true });
}
