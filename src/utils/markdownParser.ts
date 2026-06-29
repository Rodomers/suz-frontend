export const parseMarkdownToHtml = (md: string): string => {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<pre class="bg-gray-100 p-2 rounded font-mono text-xs my-2 overflow-x-auto">$1</pre>');
  html = html.replace(/^\s*###\s+(.+)$/gm, '<h3 class="text-base font-bold text-gray-800 my-2">$1</h3>');
  html = html.replace(/^\s*##\s+(.+)$/gm, '<h2 class="text-lg font-bold text-gray-800 my-2">$1</h2>');
  html = html.replace(/^\s*#\s+(.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 my-2">$1</h1>');
  html = html.replace(/^\s*[\*\-]\s+(.+)$/gm, '<li class="ml-4 list-disc text-sm text-gray-700">$1</li>');
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal text-sm text-gray-700">$1</li>');
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([\s\S]*?)\*/g, '<em>$1</em>');
  html = html.replace(/~~([\s\S]*?)~~/g, '<del>$1</del>');
  html = html.replace(/\n/g, '<br />');

  return html;
};