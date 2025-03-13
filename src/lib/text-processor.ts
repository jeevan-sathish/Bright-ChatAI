
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

// Initialize marked with highlight.js for code syntax highlighting
marked.use(
  markedHighlight({
    highlight: (code, language) => {
      if (language && hljs.getLanguage(language)) {
        return hljs.highlight(code, { language }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  })
);

// Set options for better formatting
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false
});

export function formatMarkdown(text: string): string {
  // Process the markdown
  const html = marked.parse(text) as string;
  
  // Sanitize the HTML to prevent XSS attacks
  const clean = DOMPurify.sanitize(html);
  
  return clean;
}

export function extractCodeBlocks(text: string): { language: string, code: string }[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeBlocks: { language: string, code: string }[] = [];
  
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({
      language: match[1] || 'plaintext',
      code: match[2].trim()
    });
  }
  
  return codeBlocks;
}
