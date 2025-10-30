type TagNode = {
  canonical: string;
  aliases?: string[];
  children?: string[];
};

const TAG_NODES: TagNode[] = [
  {
    canonical: "dynamic programming",
    aliases: ["dynamic programming", "dp"],
  },
  {
    canonical: "graph",
    aliases: ["graph", "graphs", "graph theory"],
    children: [
      "bfs",
      "dfs",
      "topological sort",
      "shortest path",
      "dijkstra",
      "minimum spanning tree",
    ],
  },
  {
    canonical: "bfs",
    aliases: ["bfs", "breadth first search"],
  },
  {
    canonical: "dfs",
    aliases: ["dfs", "depth first search"],
  },
  {
    canonical: "topological sort",
    aliases: ["topological sort", "topo sort", "toposort"],
  },
  {
    canonical: "shortest path",
    aliases: ["shortest path", "shortest distance"],
    children: ["dijkstra"],
  },
  {
    canonical: "dijkstra",
    aliases: ["dijkstra", "dijkstras algorithm", "dijkstra's algorithm"],
  },
  {
    canonical: "minimum spanning tree",
    aliases: ["minimum spanning tree", "mst"],
  },
  {
    canonical: "greedy",
    aliases: ["greedy", "greedy algorithms"],
  },
  {
    canonical: "backtracking",
    aliases: ["backtracking", "recursion with backtracking"],
  },
  {
    canonical: "two pointers",
    aliases: ["two pointers", "two-pointer"],
  },
  {
    canonical: "sliding window",
    aliases: ["sliding window"],
  },
  {
    canonical: "binary search",
    aliases: ["binary search", "bs"],
  },
  {
    canonical: "prefix sum",
    aliases: ["prefix sum", "prefix sums"],
  },
  {
    canonical: "math",
    aliases: ["math", "mathematics"],
  },
];

const normalize = (value: string): string => value.trim().toLowerCase();

const aliasToCanonical = new Map<string, string>();
const canonicalToAliases = new Map<string, Set<string>>();
const canonicalToChildren = new Map<string, string[]>();

for (const node of TAG_NODES) {
  const canonical = normalize(node.canonical);
  aliasToCanonical.set(canonical, canonical);

  const aliasSet = canonicalToAliases.get(canonical) ?? new Set<string>();
  aliasSet.add(canonical);

  if (node.aliases) {
    for (const alias of node.aliases) {
      const normalizedAlias = normalize(alias);
      aliasSet.add(normalizedAlias);
      if (!aliasToCanonical.has(normalizedAlias)) {
        aliasToCanonical.set(normalizedAlias, canonical);
      }
    }
  }

  canonicalToAliases.set(canonical, aliasSet);
  canonicalToChildren.set(
    canonical,
    (node.children ?? []).map((child) => normalize(child))
  );
}

export const normalizeTag = (tag: string): string => normalize(tag);

const resolveCanonical = (value: string): string => {
  const normalized = normalize(value);
  return aliasToCanonical.get(normalized) ?? normalized;
};

const collectAliasesForCanonical = (canonical: string, target: Set<string>) => {
  const aliasSet = canonicalToAliases.get(canonical);
  if (aliasSet) {
    aliasSet.forEach((alias) => target.add(alias));
  } else {
    target.add(canonical);
  }
};

export const expandSearchTerm = (term: string): Set<string> => {
  const normalizedTerm = normalize(term);
  const canonical = aliasToCanonical.get(normalizedTerm);

  if (!canonical) {
    return new Set([normalizedTerm]);
  }

  const expansions = new Set<string>();
  collectAliasesForCanonical(canonical, expansions);
  expansions.add(canonical);

  const children = canonicalToChildren.get(canonical);
  if (children) {
    for (const childCanonical of children) {
      collectAliasesForCanonical(childCanonical, expansions);
      expansions.add(childCanonical);
    }
  }

  return expansions;
};

export const tagsMatchQuery = (
  tags: string[] | undefined,
  term: string
): boolean => {
  if (!tags || tags.length === 0) return false;

  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;

  const expansions = expandSearchTerm(normalizedTerm);
  expansions.add(resolveCanonical(normalizedTerm));

  return tags.some((tag) => {
    const normalizedTag = normalize(tag);
    const canonicalTag = resolveCanonical(tag);
    return (
      expansions.has(normalizedTag) ||
      expansions.has(canonicalTag) ||
      normalizedTag.includes(normalizedTerm)
    );
  });
};
