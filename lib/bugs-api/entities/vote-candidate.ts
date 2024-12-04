import { z } from 'zod';
import { Color } from './color';
import { zext } from '../../zext';

export const VoteCandidate = z.object({
  candidate_eng_title: z.null(),
  candidate_sub_title: z.null(),
  candidate_title: z.string(),
  img_yn: z.boolean(),
  vote_percent: z.number(),
  vote_rank: z.number().int(),
  streaming_percent: z.number(),
  album_id: z.number().int(),
  artist_id: z.number().int(),
  track_id: z.number().int(),
  track: z.null(),
  image: z.object({
    remove_yn: z.boolean(),
    urls: z.null(),
    upd_dt: zext.instant.epochMillis.int.nullIfZero(),
    image_id: z.number().int(),
    ratio: z.number(),
    color: Color.zod,
    url: z.null(),
    path: z.string(),
  }),
  mv_id: z.number().int(),
  es_album_id: z.number().int(),
  content_id: z.number().int(),
  vote_candidate_id: z.number().int(),
  vote_point: z.number().int(),
  img_url: z.null(),
  mv: z.null(),
  eng_description: z.null(),
});

export type VoteCandidate = z.infer<typeof VoteCandidate>;
