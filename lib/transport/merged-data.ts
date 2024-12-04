import { z } from 'zod';
import { TComment } from './comment';
import { TCandidateData } from './candidate-data';
import { TCandidate } from './candidate';
import { zext } from '../bugs-api/entities';

export const TMergedData = z.object({
  recordedTimeRange: z.object({
    begin: zext.instant.iso.string(),
    end: zext.instant.iso.string(),
  }),
  favorite: z.object({
    title: z.string(),
    description: z.string(),
    beginAt: zext.instant.iso.string(),
    endAt: zext.instant.iso.string(),
    candidates: z.record(TCandidate),
    candidateData: z.record(
      z.array(
        z.object({
          timestamp: zext.instant.iso.string(),
          data: TCandidateData,
        }),
      ),
    ),
  }),
  comments: z.array(TComment),
});
export type TMergedData = z.infer<typeof TMergedData>;
