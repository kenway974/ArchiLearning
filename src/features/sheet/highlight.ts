/**
 * Coloration syntaxique minimale, sans dépendance : commentaires, chaînes, nombres,
 * mots-clés et annotations. Suffisant pour des extraits pédagogiques.
 */
export type TokenType = 'comment' | 'string' | 'number' | 'keyword' | 'annotation' | 'plain';
export type Token = { type: TokenType; text: string };

const KEYWORDS: Record<string, string[]> = {
  common: ['if', 'else', 'for', 'while', 'return', 'switch', 'case', 'break', 'continue', 'new', 'class', 'try', 'catch', 'finally', 'throw', 'import', 'true', 'false', 'null', 'public', 'private', 'protected', 'static', 'final', 'this', 'default'],
  typescript: ['const', 'let', 'function', 'export', 'from', 'async', 'await', 'interface', 'type', 'readonly', 'implements', 'extends', 'of', 'in', 'as', 'undefined', 'void', 'number', 'string', 'boolean', 'unknown', 'satisfies'],
  javascript: ['const', 'let', 'function', 'export', 'from', 'async', 'await', 'of', 'in', 'undefined'],
  java: ['package', 'void', 'long', 'int', 'boolean', 'record', 'interface', 'extends', 'implements', 'var', 'throws', 'sealed', 'permits'],
  kotlin: ['fun', 'val', 'var', 'object', 'companion', 'data', 'value', 'when', 'init', 'package', 'override', 'private', 'internal'],
  csharp: ['namespace', 'using', 'void', 'var', 'async', 'await', 'record', 'sealed', 'readonly', 'interface', 'string', 'decimal', 'int', 'bool', 'is', 'get', 'set', 'init', 'Task'],
  php: ['function', 'namespace', 'use', 'echo', 'foreach', 'as', 'fn', 'array', 'int', 'string', 'void', 'self', 'readonly', 'exit'],
  go: ['package', 'func', 'var', 'const', 'type', 'struct', 'interface', 'range', 'go', 'chan', 'defer', 'map', 'select', 'nil', 'error', 'string', 'int'],
  swift: ['func', 'let', 'var', 'struct', 'enum', 'guard', 'protocol', 'extension', 'self'],
  python: ['def', 'import', 'from', 'as', 'with', 'lambda', 'None', 'True', 'False', 'self', 'pass', 'yield'],
};

const HASH_COMMENT = new Set(['python', 'shell', 'yaml']);

export function tokenize(source: string, language: string): Token[] {
  const keywords = new Set([...KEYWORDS.common!, ...(KEYWORDS[language] ?? [])]);
  const lineComment = HASH_COMMENT.has(language) ? '#' : '//';
  const tokens: Token[] = [];
  let plain = '';
  const flush = () => {
    if (plain) tokens.push({ type: 'plain', text: plain });
    plain = '';
  };
  const push = (type: TokenType, text: string) => {
    flush();
    tokens.push({ type, text });
  };

  let i = 0;
  while (i < source.length) {
    const rest = source.slice(i);
    const ch = source[i]!;

    if (rest.startsWith(lineComment) || (language === 'php' && ch === '#' && source[i + 1] !== '[')) {
      const end = source.indexOf('\n', i);
      const text = end === -1 ? rest : source.slice(i, end);
      push('comment', text);
      i += text.length;
      continue;
    }
    if (rest.startsWith('/*')) {
      const end = source.indexOf('*/', i + 2);
      const text = end === -1 ? rest : source.slice(i, end + 2);
      push('comment', text);
      i += text.length;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      while (j < source.length && source[j] !== ch) j += source[j] === '\\' ? 2 : 1;
      const text = source.slice(i, j + 1);
      push('string', text);
      i += text.length;
      continue;
    }
    if ((ch === '@' || (ch === '#' && source[i + 1] === '[')) && /[\w[]/.test(source[i + 1] ?? '')) {
      const m = /^(@\w+|#\[\w+)/.exec(rest);
      if (m) {
        push('annotation', m[0]);
        i += m[0].length;
        continue;
      }
    }
    if (/\d/.test(ch) && !/[\w$]/.test(source[i - 1] ?? '')) {
      const m = /^\d[\d_.]*/.exec(rest)!;
      push('number', m[0]);
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_$]/.test(ch) && !/[\w$]/.test(source[i - 1] ?? '')) {
      const m = /^[A-Za-z_$][\w$]*/.exec(rest)!;
      if (keywords.has(m[0])) push('keyword', m[0]);
      else plain += m[0];
      i += m[0].length;
      continue;
    }
    plain += ch;
    i += 1;
  }
  flush();
  return tokens;
}

export const LANGUAGE_LABELS: Record<string, string> = {
  java: 'Java',
  php: 'PHP',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  csharp: 'C#',
  kotlin: 'Kotlin',
  swift: 'Swift',
  go: 'Go',
  python: 'Python',
  sql: 'SQL',
  yaml: 'YAML',
  json: 'JSON',
  shell: 'Shell',
};
