import { useMemo } from 'react';
import type { CodeSample } from '../../content/schema';
import { CopyButton } from '../../shared/CopyButton';
import { LANGUAGE_LABELS, tokenize } from './highlight';

export function CodeBlock({ code }: { code: CodeSample }) {
  const tokens = useMemo(() => tokenize(code.source, code.language), [code]);
  return (
    <figure className="code">
      <figcaption className="code-head">
        <span className="code-language" data-testid="code-language" data-language={code.language}>
          {LANGUAGE_LABELS[code.language] ?? code.language}
        </span>
        <span className="code-file">{code.filename}</span>
        <CopyButton text={code.source} label="Copier le code" />
      </figcaption>
      <pre tabIndex={0} aria-label={`Code ${code.filename}`}>
        <code>
          {tokens.map((t, i) =>
            t.type === 'plain' ? <span key={i}>{t.text}</span> : <span key={i} className={`tok-${t.type}`}>{t.text}</span>,
          )}
        </code>
      </pre>
    </figure>
  );
}
