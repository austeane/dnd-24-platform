import { unified } from "unified";
import remarkParse from "remark-parse";
import { toString } from "mdast-util-to-string";
import type { Root, Content, Heading } from "mdast";

/** Parse a markdown string into a remark AST */
export function parseMarkdown(markdown: string): Root {
  const processor = unified().use(remarkParse);
  return processor.parse(markdown);
}

/** Get the plain text content of an AST node */
export function nodeText(node: Content): string {
  return toString(node).trim();
}

/**
 * Split an AST into sections by heading level.
 * Returns an array of { heading, children } where children are all nodes
 * between this heading and the next heading of equal or lesser depth.
 */
export function splitByHeading(
  root: Root,
  level: Heading["depth"],
): Array<{ heading: string; children: Content[] }> {
  const sections: Array<{ heading: string; children: Content[] }> = [];
  let current: { heading: string; children: Content[] } | undefined;

  for (const node of root.children) {
    if (node.type === "heading" && node.depth === level) {
      if (current) {
        sections.push(current);
      }
      current = { heading: nodeText(node), children: [] };
    } else if (current) {
      current.children.push(node);
    }
  }

  if (current) {
    sections.push(current);
  }

  return sections;
}

/**
 * Check if a string looks like a page number line from the SRD
 * (e.g. "104 System Reference Document 5.2.1")
 */
export function isPageNumberLine(text: string): boolean {
  return /^\d+\s+System Reference Document/.test(text.trim());
}
