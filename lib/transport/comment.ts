import { z } from 'zod';
import { zext } from '../bugs-api/entities';

export const TComment = z.object({
  id: z.string(),
  nickname: z.string(),
  content: z.string(),

  upvotes: z.number().int(),
  createdAt: zext.instant.iso.string(),
});
export type TComment = z.infer<typeof TComment>;
