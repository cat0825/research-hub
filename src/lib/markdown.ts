export function stripMarkdown(md: string): string {
  return (
    md
      // Fenced code blocks must go before inline code
      .replace(/```[\s\S]*?```/g, "")
      // Inline code
      .replace(/`([^`]+)`/g, "$1")
      // Images (keep alt text)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Links (keep text)
      .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Heading markers
      .replace(/^#{1,6}\s+/gm, "")
      // Bold/italic
      .replace(/(\*{1,3})(.*?)\1/g, "$2")
      .replace(/(_{1,3})(.*?)\1/g, "$2")
      // Strikethrough
      .replace(/~~(.*?)~~/g, "$1")
      // Blockquote markers
      .replace(/^>\s+/gm, "")
      // Horizontal rules
      .replace(/^\s*[-*_]{3,}\s*$/gm, "")
      // Unordered list markers
      .replace(/^\s*[-*+]\s+/gm, "")
      // Ordered list markers
      .replace(/^\s*\d+\.\s+/gm, "")
      // HTML tags
      .replace(/<[^>]+>/g, "")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}
