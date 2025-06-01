// utils/formatHtml.ts

export function formatHtml(rawHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const body = doc.body;

  const createStyledHeader = (text: string): HTMLElement => {
    const h3 = document.createElement('h3');
    h3.className = 'text-lg font-semibold mt-6 mb-2';
    h3.textContent = text;
    return h3;
  };

  const cleanNode = (node: Node): Node | null => {
    if (node.nodeType === Node.COMMENT_NODE) return null;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim() ?? '';
      return text ? node : null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // Remove empty elements
      const isEmpty =
        el.children.length === 0 &&
        el.textContent?.trim() === '' &&
        !['br', 'img'].includes(tag);
      if (isEmpty) return null;

      // Replace <strong> inside <span>/<p> with <h3>
      if (tag === 'strong' || tag === 'b') {
        const text = el.textContent?.trim();
        if (text) return createStyledHeader(text);
      }

      // Remove nested <span><ul>...</ul></span> and preserve <ul>
      if (tag === 'span' && el.children.length === 1 && el.children[0].tagName === 'UL') {
        return cleanNode(el.children[0]);
      }

      // Convert <ul> to styled list
      if (tag === 'ul') {
        el.classList.add('list-disc', 'list-inside', 'space-y-1');
      }

      if (tag === 'li') {
        el.classList.add('ml-4');
      }

      // Recursively clean children
      const cleanedChildren = [...el.childNodes]
        .map(cleanNode)
        .filter(Boolean) as Node[];
      el.replaceChildren(...cleanedChildren);

      return el;
    }

    return null;
  };

  const cleaned = [...body.childNodes]
    .map(cleanNode)
    .filter(Boolean) as Node[];

  body.replaceChildren(...cleaned);
  return body.innerHTML.trim();
}


// utils/extractPlainText.ts

export function extractPlainText(html: string): string {
  if (!html || typeof html !== 'string') return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
}
