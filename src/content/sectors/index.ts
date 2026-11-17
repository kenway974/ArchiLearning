import type { SectorSheet } from '../schema';
import { banqueFintech } from './banque-fintech';
import { eCommerce } from './e-commerce';
import { saasB2b } from './saas-b2b';
import { siteVitrine } from './site-vitrine';

/** Ordre d'affichage : du plus simple au plus contraint. */
export const sectors: SectorSheet[] = [siteVitrine, eCommerce, saasB2b, banqueFintech];
