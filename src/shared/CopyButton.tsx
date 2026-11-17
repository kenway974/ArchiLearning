import { useEffect, useState } from 'react';
import { Icon } from './Icon';

/** Bouton « Copier » : son nom accessible devient « Copié » pendant deux secondes. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Presse-papiers refusé : on ne fait rien, le texte reste sélectionnable.
    }
  };

  return (
    <button type="button" className="btn btn-small" onClick={copy}>
      <Icon name={copied ? 'check' : 'copy'} size={16} />
      {copied ? 'Copié' : label}
    </button>
  );
}
