import { z } from 'zod';
import type { BackupData } from '../domain/backup';
import type { Car } from '../domain/car';
import type { CarCandidate } from '../domain/carCandidate';
import type { Criterion } from '../domain/criterion';
import type { NewsItem } from '../domain/news';
import type { Settings } from '../domain/settings';
import type { UserCarState } from '../domain/userState';

const sourcedSchema = z.object({
  value: z.union([z.number(), z.boolean(), z.string()]).nullable(),
  confidence: z.enum(['verified', 'estimated', 'ai-extracted']),
  source: z.string().optional(),
  updatedAt: z.string().optional(),
});

const carObject = z.object({
  id: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  variant: z.string().optional(),
  bodyType: z.enum(['suv', 'sedan', 'hatchback', 'wagon', 'other']),
  powertrain: z.enum(['bev', 'phev', 'reev']),
  attributes: z.record(sourcedSchema),
});

// Annotating with the domain type makes the compiler check that schema and type agree.
export const carSchema: z.ZodType<Car> = carObject;

export const carCandidateSchema: z.ZodType<CarCandidate> = carObject
  .omit({ id: true })
  .extend({ sourceUrl: z.string().url() });

export const newsItemSchema: z.ZodType<NewsItem> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  source: z.string().min(1),
  publishedAt: z.string().min(1),
  summary: z.string().optional(),
  carIds: z.array(z.string()),
});

const criterionBase = {
  id: z.string().min(1),
  label: z.string().min(1),
  attributeKey: z.string().min(1),
  weight: z.number().min(0).max(10),
  knockout: z.boolean(),
};

export const criterionSchema: z.ZodType<Criterion> = z.discriminatedUnion('kind', [
  z.object({ ...criterionBase, kind: z.literal('boolean') }),
  z.object({
    ...criterionBase,
    kind: z.literal('number'),
    direction: z.enum(['higher-better', 'lower-better']),
    min: z.number(),
    max: z.number(),
  }),
  z.object({
    ...criterionBase,
    kind: z.literal('choice'),
    scores: z.record(z.number().min(0).max(1)),
  }),
]);

export const settingsSchema: z.ZodType<Settings> = z.object({
  criteria: z.array(criterionSchema),
  suggestionThreshold: z.number().min(0).max(100),
});

export const userCarStateSchema: z.ZodType<UserCarState> = z.object({
  carId: z.string().min(1),
  status: z.enum(['watching', 'interested', 'test-drive-planned', 'rejected']),
  notes: z.string(),
  checklist: z.record(z.boolean()),
});

export const backupSchema: z.ZodType<BackupData> = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  settings: settingsSchema,
  userState: z.array(userCarStateSchema),
});

/** Keeps valid items, reports invalid ones, never throws. */
export function parseValid<T>(
  schema: z.ZodType<T>,
  items: readonly unknown[],
  onInvalid: (index: number, message: string) => void,
): T[] {
  const valid: T[] = [];
  items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ');
      onInvalid(index, message);
    }
  });
  return valid;
}
