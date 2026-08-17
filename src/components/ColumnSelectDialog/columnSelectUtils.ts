export interface FieldNode {
  key: string;
  displayName: string;
  isParent: boolean;
  subfields: FieldNode[];
  rawColumn?: string;
}

/**
 * Builds a hierarchical list of FieldNode items from a flat array of column names.
 * Columns containing '::' are grouped under parent nodes based on prefix.
 * Optionally scopes node keys with docTypePrefix to ensure document type header independence.
 */
export const buildFieldTree = (
  columns: string[],
  docTypePrefix?: string
): FieldNode[] => {
  const uniqueColumns = Array.from(new Set(columns));
  const makeKey = (name: string) =>
    docTypePrefix ? `${docTypePrefix}::${name}` : name;

  // 1. Identify all parent prefixes (e.g. "Details_Of_Plugging" from "Details_Of_Plugging::To")
  const prefixChildMap = new Map<string, string[]>();
  uniqueColumns.forEach((col) => {
    if (col.includes("::")) {
      const parts = col.split("::");
      const prefix = parts.slice(0, -1).join("::");
      if (!prefixChildMap.has(prefix)) {
        prefixChildMap.set(prefix, []);
      }
      prefixChildMap.get(prefix)!.push(col);
    }
  });

  const parentNodeMap = new Map<string, FieldNode>();
  const topLevelNodes: FieldNode[] = [];

  // 2. Instantiate parent nodes for all identified prefixes
  prefixChildMap.forEach((_children, prefix) => {
    const parentNode: FieldNode = {
      key: makeKey(prefix),
      displayName: prefix,
      isParent: true,
      subfields: [],
      rawColumn: uniqueColumns.includes(prefix) ? prefix : undefined,
    };
    parentNodeMap.set(prefix, parentNode);
    topLevelNodes.push(parentNode);
  });

  // 3. Populate subfields and standalone top-level leaf nodes
  const processedColumns = new Set<string>();

  uniqueColumns.forEach((col) => {
    if (processedColumns.has(col)) return;

    if (col.includes("::")) {
      const parts = col.split("::");
      const prefix = parts.slice(0, -1).join("::");

      if (parentNodeMap.has(prefix)) {
        const parentNode = parentNodeMap.get(prefix)!;
        if (col !== prefix) {
          const childName = parts[parts.length - 1];
          parentNode.subfields.push({
            key: makeKey(col),
            displayName: childName,
            isParent: false,
            subfields: [],
            rawColumn: col,
          });
          processedColumns.add(col);
        } else {
          processedColumns.add(col);
        }
      }
    } else {
      if (parentNodeMap.has(col)) {
        // Already created as a parent node in Step 2
        processedColumns.add(col);
      } else {
        // Standalone leaf node
        processedColumns.add(col);
        topLevelNodes.push({
          key: makeKey(col),
          displayName: col,
          isParent: false,
          subfields: [],
          rawColumn: col,
        });
      }
    }
  });

  return topLevelNodes;
};

/**
 * Gets all keys represented by a FieldNode and its subfield descendants.
 */
export const getAllNodeKeys = (node: FieldNode): string[] => {
  const keys: string[] = [node.key];
  node.subfields.forEach((sub) => {
    keys.push(...getAllNodeKeys(sub));
  });
  return Array.from(new Set(keys));
};

/**
 * Calculates check state for a FieldNode based on currently selected keys.
 */
export const getNodeCheckState = (
  node: FieldNode,
  selectedKeys: string[]
): { checked: boolean; indeterminate: boolean } => {
  const nodeKeys = getAllNodeKeys(node);
  if (nodeKeys.length === 0) {
    return { checked: false, indeterminate: false };
  }

  const selectedSet = new Set(selectedKeys);
  let matchCount = 0;
  nodeKeys.forEach((k) => {
    if (selectedSet.has(k)) matchCount++;
  });

  if (matchCount === nodeKeys.length) {
    return { checked: true, indeterminate: false };
  } else if (matchCount > 0) {
    return { checked: false, indeterminate: true };
  } else {
    return { checked: false, indeterminate: false };
  }
};

/**
 * Handles toggling a parent or leaf node. Returns the updated selected keys array.
 */
export const toggleNodeSelection = (
  node: FieldNode,
  selectedKeys: string[]
): string[] => {
  const nodeKeys = getAllNodeKeys(node);
  const selectedSet = new Set(selectedKeys);

  const state = getNodeCheckState(node, selectedKeys);
  const shouldSelect = !state.checked;

  if (shouldSelect) {
    nodeKeys.forEach((k) => selectedSet.add(k));
  } else {
    nodeKeys.forEach((k) => selectedSet.delete(k));
  }

  return Array.from(selectedSet);
};

/**
 * Maps selected scoped node keys back to unique raw column name strings.
 */
export const getRawColumnsFromKeys = (
  nodes: FieldNode[],
  selectedKeys: string[]
): string[] => {
  const selectedSet = new Set(selectedKeys);
  const rawCols = new Set<string>();

  const collect = (n: FieldNode) => {
    if (selectedSet.has(n.key) && n.rawColumn) {
      rawCols.add(n.rawColumn);
    }
    n.subfields.forEach(collect);
  };

  nodes.forEach(collect);
  return Array.from(rawCols);
};

/**
 * Filters a list of FieldNode items matching a search query string.
 */
export const filterFieldNodes = (
  nodes: FieldNode[],
  query: string
): FieldNode[] => {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const result: FieldNode[] = [];

  nodes.forEach((node) => {
    const parentMatches =
      node.displayName.toLowerCase().includes(q) ||
      node.key.toLowerCase().includes(q);

    if (node.isParent) {
      const matchingSubfields = node.subfields.filter(
        (sub) =>
          parentMatches ||
          sub.displayName.toLowerCase().includes(q) ||
          sub.key.toLowerCase().includes(q)
      );

      if (parentMatches || matchingSubfields.length > 0) {
        result.push({
          ...node,
          subfields: parentMatches ? node.subfields : matchingSubfields,
        });
      }
    } else if (parentMatches) {
      result.push(node);
    }
  });

  return result;
};
