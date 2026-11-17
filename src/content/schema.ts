import { z } from 'zod';

/** Texte obligatoire : une chaîne vide ou faite d'espaces est refusée. */
const text = z.string().trim().min(1, 'texte vide');
const textList = z.array(text).min(1, 'liste vide');

export type TreeNode = {
  name: string;
  kind: 'dir' | 'file';
  /** Rôle du dossier ou du fichier, affiché au clic dans l'arborescence. */
  role: string;
  children?: TreeNode[] | undefined;
};

export const treeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    name: text,
    kind: z.enum(['dir', 'file']),
    role: text,
    children: z.array(treeNodeSchema).optional(),
  }),
);

export const quizQuestionSchema = z
  .object({
    question: text,
    choices: z.array(text).min(2, 'au moins deux choix'),
    answer: z.number().int().nonnegative(),
    explanation: text,
  })
  .refine((q) => q.answer < q.choices.length, { message: 'bonne réponse hors des choix', path: ['answer'] })
  .refine((q) => new Set(q.choices).size === q.choices.length, { message: 'choix en double', path: ['choices'] });

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

const stepRefSchema = z.object({ id: text, reason: text });
export type StepRef = z.infer<typeof stepRefSchema>;

export const LANGUAGES = ['java', 'php', 'typescript', 'javascript', 'csharp', 'kotlin', 'swift', 'go', 'python'] as const;
export type Language = (typeof LANGUAGES)[number];

const codeSampleSchema = z.object({
  language: z.enum([...LANGUAGES, 'sql', 'yaml', 'json', 'shell']),
  filename: text,
  source: text,
});
export type CodeSample = z.infer<typeof codeSampleSchema>;

const baseSheet = {
  id: z.string(),
  title: text,
  /** Idée en une phrase (concept) ou résumé du secteur. */
  summary: text,
  tree: z.array(treeNodeSchema).min(1, 'arborescence vide'),
  code: codeSampleSchema,
  pitfalls: textList,
  prerequisites: z.array(stepRefSchema),
  nextSteps: z.array(stepRefSchema),
  quiz: z.array(quizQuestionSchema).min(3, 'au moins 3 questions').max(8, 'au plus 8 questions'),
  linkedinPost: text,
};

export const conceptSheetSchema = z.object({
  ...baseSheet,
  kind: z.literal('concept'),
  problem: text,
  whenToUse: textList,
  whenToAvoid: textList,
  teamSize: text,
  /** Identifiants des concepts voisins ; chacun doit avoir un lien dans links.ts. */
  neighbors: z.array(z.string()),
});
export type ConceptSheet = z.infer<typeof conceptSheetSchema>;

const sizeRecoSchema = z.object({ architecture: text, why: text });

export const sectorSheetSchema = z.object({
  ...baseSheet,
  kind: z.literal('sector'),
  context: text,
  constraints: textList,
  bySize: z.object({ small: sizeRecoSchema, medium: sizeRecoSchema, large: sizeRecoSchema }),
  stack: z.object({ language: z.enum(LANGUAGES), framework: text, why: text }),
  /** Entreprises réelles : seulement des faits publics, avec leur source. */
  companies: z.array(z.object({ name: text, fact: text, source: z.string().url('source : URL attendue') })),
});
export type SectorSheet = z.infer<typeof sectorSheetSchema>;

export type Sheet = ConceptSheet | SectorSheet;

export const linkSchema = z.object({
  id: text,
  source: text,
  target: text,
  title: text,
  explanation: text,
});
export type Link = z.infer<typeof linkSchema>;

export type Content = {
  concepts: ConceptSheet[];
  sectors: SectorSheet[];
  links: Link[];
};
