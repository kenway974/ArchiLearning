import type { ConceptSheet } from '../schema';
import { architectureEnCouches } from './architecture-en-couches';
import { architectureEvenementielle } from './architecture-evenementielle';
import { cleanOnion } from './clean-onion';
import { cqrs } from './cqrs';
import { ddd } from './ddd';
import { eventSourcing } from './event-sourcing';
import { hexagonale } from './hexagonale';
import { microkernel } from './microkernel';
import { microservices } from './microservices';
import { monolithe } from './monolithe';
import { monolitheModulaire } from './monolithe-modulaire';
import { mvc } from './mvc';
import { pipesAndFilters } from './pipes-and-filters';
import { serverless } from './serverless';
import { transactionScript } from './transaction-script';
import { verticalSlice } from './vertical-slice';

/** Ordre d'affichage : de l'organisation du code au découpage du système. */
export const concepts: ConceptSheet[] = [
  transactionScript,
  architectureEnCouches,
  mvc,
  hexagonale,
  cleanOnion,
  ddd,
  verticalSlice,
  cqrs,
  eventSourcing,
  monolithe,
  monolitheModulaire,
  microservices,
  architectureEvenementielle,
  serverless,
  microkernel,
  pipesAndFilters,
];
