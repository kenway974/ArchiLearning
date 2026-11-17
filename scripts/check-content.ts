/**
 * Lancé avant chaque build : refuse de construire le site si une fiche est incomplète
 * ou si un lien pointe vers un nœud inexistant.
 */
import { content } from '../src/content/index';
import { checkContent } from '../src/content/validate';

const result = checkContent(content);
if (result.ok) {
  console.log(`✔ ${result.message} (${content.concepts.length} concepts, ${content.sectors.length} secteurs, ${content.links.length} liens)`);
} else {
  console.error(result.message);
  process.exit(1);
}
