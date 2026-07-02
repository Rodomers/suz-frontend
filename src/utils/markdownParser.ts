export const parseMarkdownToHtml = (md: string): string => {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const placeholders: string[] = [];

  html = html.replace(/\`\`\`([\s\S]*?)\`\`\`/g, (_match, code) => {
    const id = `__PLACE_C_${placeholders.length}__`;
    placeholders.push(`<pre class="bg-gray-100 p-2 rounded font-mono text-xs my-2 overflow-x-auto">${code}</pre>`);
    return id;
  });

  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, text, url) => {
    const id = `__PLACE_L_${placeholders.length}__`;
    const display = text.length > 40 ? text.slice(0, 37) + '...' : text;
    placeholders.push(`<a href="${url}" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">${display}</a>`);
    return id;
  });

  html = html.replace(/\b(https?:\/\/[^\s<]+)/g, (_match, url) => {
    let cleanUrl = url;
    let trailing = '';
    const matchPunct = cleanUrl.match(/[.,;:!?)]+$/);
    if (matchPunct) {
      trailing = matchPunct[0];
      cleanUrl = cleanUrl.slice(0, -trailing.length);
    }
    const id = `__PLACE_R_${placeholders.length}__`;
    const display = cleanUrl.length > 40 ? cleanUrl.slice(0, 37) + '...' : cleanUrl;
    placeholders.push(`<a href="${cleanUrl}" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">${display}</a>`);
    return id + trailing;
  });

  html = html.replace(/^\s*###\s+(.+)$/gm, '<h3 class="text-base font-bold text-gray-800 mt-4 mb-0">$1</h3>');
  html = html.replace(/^\s*##\s+(.+)$/gm, '<h2 class="text-lg font-bold text-gray-800 mt-5 mb-0">$1</h2>');
  html = html.replace(/^\s*#\s+(.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-6 mb-0">$1</h1>');
  html = html.replace(/^\s*[\*\-]\s+(.+)$/gm, '<li class="ml-4 list-disc text-sm text-gray-700">$1</li>');
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal text-sm text-gray-700">$1</li>');
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([\s\S]*?)\*/g, '<em>$1</em>');
  html = html.replace(/~~([\s\S]*?)~~/g, '<del>$1</del>');
  html = html.replace(/\n/g, '<br />');

  html = html.replace(/(<\/li>)\s*<br\s*\/?>/gi, '$1');
  html = html.replace(/(<\/h[1-3]>)\s*<br\s*\/?>/gi, '$1');

  for (let i = 0; i < placeholders.length; i++) {
    html = html.replace(`__PLACE_C_${i}__`, placeholders[i]);
    html = html.replace(`__PLACE_L_${i}__`, placeholders[i]);
    html = html.replace(`__PLACE_R_${i}__`, placeholders[i]);
  }

  html = html.replace(/(<\/pre>)\s*<br\s*\/?>/gi, '$1');

  return html;
};