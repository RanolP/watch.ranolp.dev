import { z } from 'zod';

export const TCandidateData = z.object({
  id: z.string(),
  candidateId: z.string(),
  rank: z.number().int(),
  votePercent: z.number(),
  votePoints: z.number().int(),
  streamingPercent: z.number(),
});
export type TCandidateData = z.infer<typeof TCandidateData>;
