
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

/**
 * Format markdown to HTML with syntax highlighting
 */
export function formatMarkdown(text: string): string {
  // Configure marked with syntax highlighting
  marked.use(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      }
    })
  );

  // Set marked options for better formatting
  marked.setOptions({
    gfm: true,
    breaks: true
  });

  // Convert markdown to HTML
  const html = marked.parse(text);
  
  // Sanitize HTML
  const clean = DOMPurify.sanitize(html);
  
  return clean;
}
