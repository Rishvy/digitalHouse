export interface KonvaNodeLike {
  className?: string;
  attrs?: Record<string, unknown>;
  children?: KonvaNodeLike[];
}

export function flattenKonvaNodes(root: KonvaNodeLike): KonvaNodeLike[] {
  const out: KonvaNodeLike[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    out.push(node);
    for (const child of node.children ?? []) stack.push(child);
  }
  return out;
}
