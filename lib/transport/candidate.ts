import { z } from 'zod';

export const TCandidate = z.object({
  name: z.string(),
  id: z.string(),
  imageUrl: z.string(),
});
export type TCandidate = z.infer<typeof TCandidate>;
