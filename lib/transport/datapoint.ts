import { z } from 'zod';
import { TComment } from './comment';
import { TCandidate } from './candidate';
import { TCandidateData } from './candidate-data';
import { zext } from '../bugs-api/entities';

export const TDatapoint = z.object({
  favorite: z.object({
    title: z.string(),
    description: z.string(),

    beginAt: zext.instant.iso.string(),
    endAt: zext.instant.iso.string(),

    candidates: z.record(TCandidate),
    candidateData: z.record(TCandidateData),
  }),
  comments: z.array(TComment),
});
export type TDatapoint = z.infer<typeof TDatapoint>;
