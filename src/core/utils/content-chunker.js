import TokenCounter from "./token-counter.js";

/**
 * Content chunking utility for handling large documents
 */
class ContentChunker {
  /**
   * Split content into chunks using smart strategy
   * @param {string} content
   * @param {number} tokenLimit
   * @param {string} strategy - 'smart', 'simple', 'markdown'
   * @returns {Array<{content: string, index: number, total: number}>}
   */
  static chunk(content, tokenLimit = 8000, strategy = "smart") {
    if (!TokenCounter.exceedsLimit(content, tokenLimit)) {
      return [{ content, index: 0, total: 1 }];
    }

    switch (strategy) {
      case "markdown":
        return this.chunkByMarkdown(content, tokenLimit);
      case "simple":
        return this.chunkBySize(content, tokenLimit);
      case "smart":
      default:
        return this.chunkSmart(content, tokenLimit);
    }
  }

  /**
   * Smart chunking - tries markdown first, falls back to paragraph
   */
  static chunkSmart(content, tokenLimit) {
    // Check if content looks like markdown
    if (content.match(/^#{1,6}\s/m) || content.includes("```")) {
      return this.chunkByMarkdown(content, tokenLimit);
    }

    // Otherwise use paragraph-based chunking
    return this.chunkByParagraphs(content, tokenLimit);
  }

  /**
   * Chunk by markdown sections (headings)
   */
  static chunkByMarkdown(content, tokenLimit) {
    const chunks = [];
    const sections = this.splitByHeadings(content);

    let currentChunk = "";
    let currentIndex = 0;

    for (const section of sections) {
      // If section alone exceeds limit, split it further
      if (TokenCounter.exceedsLimit(section, tokenLimit)) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = "";
        }

        // Split large section by paragraphs
        const subChunks = this.chunkByParagraphs(section, tokenLimit);
        chunks.push(...subChunks.map((c) => c.content));
      } else if (
        TokenCounter.exceedsLimit(currentChunk + "\n\n" + section, tokenLimit)
      ) {
        // Current chunk + section would exceed limit
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = section;
      } else {
        // Add section to current chunk
        currentChunk = currentChunk
          ? currentChunk + "\n\n" + section
          : section;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.map((content, index) => ({
      content,
      index,
      total: chunks.length,
    }));
  }

  /**
   * Split markdown by headings
   */
  static splitByHeadings(content) {
    const sections = [];
    const lines = content.split("\n");
    let currentSection = [];

    for (const line of lines) {
      if (line.match(/^#{1,6}\s/)) {
        // Found a heading
        if (currentSection.length > 0) {
          sections.push(currentSection.join("\n"));
          currentSection = [];
        }
      }
      currentSection.push(line);
    }

    if (currentSection.length > 0) {
      sections.push(currentSection.join("\n"));
    }

    return sections;
  }

  /**
   * Chunk by paragraphs (double newline)
   */
  static chunkByParagraphs(content, tokenLimit) {
    const chunks = [];
    const paragraphs = content.split(/\n\n+/);

    let currentChunk = "";

    for (const paragraph of paragraphs) {
      // If single paragraph exceeds limit, split by sentences
      if (TokenCounter.exceedsLimit(paragraph, tokenLimit)) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = "";
        }

        const sentenceChunks = this.chunkBySentences(paragraph, tokenLimit);
        chunks.push(...sentenceChunks.map((c) => c.content));
      } else if (
        TokenCounter.exceedsLimit(
          currentChunk + "\n\n" + paragraph,
          tokenLimit
        )
      ) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = paragraph;
      } else {
        currentChunk = currentChunk
          ? currentChunk + "\n\n" + paragraph
          : paragraph;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.map((content, index) => ({
      content,
      index,
      total: chunks.length,
    }));
  }

  /**
   * Chunk by sentences
   */
  static chunkBySentences(content, tokenLimit) {
    const chunks = [];
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];

    let currentChunk = "";

    for (const sentence of sentences) {
      if (TokenCounter.exceedsLimit(sentence, tokenLimit)) {
        // Single sentence too long, split by size
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = "";
        }

        const sizeChunks = this.chunkBySize(sentence, tokenLimit);
        chunks.push(...sizeChunks.map((c) => c.content));
      } else if (
        TokenCounter.exceedsLimit(currentChunk + " " + sentence, tokenLimit)
      ) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = sentence;
      } else {
        currentChunk = currentChunk
          ? currentChunk + " " + sentence
          : sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.map((content, index) => ({
      content,
      index,
      total: chunks.length,
    }));
  }

  /**
   * Simple size-based chunking (fallback)
   */
  static chunkBySize(content, tokenLimit) {
    const chunks = [];
    const chunkSize = TokenCounter.getChunkSize(tokenLimit);

    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    return chunks.map((content, index) => ({
      content,
      index,
      total: chunks.length,
    }));
  }

  /**
   * Merge chunked results back together
   */
  static mergeChunks(chunks) {
    return chunks.map((chunk) => chunk.content).join("\n\n");
  }
}

export default ContentChunker;
