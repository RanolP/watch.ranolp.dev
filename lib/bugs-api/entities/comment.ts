import { Temporal } from 'temporal-polyfill';
import { z } from 'zod';

export const Comment = z.object({
  comment_group_id: z.number().int(),
  msrl: z.number().int(),
  musicpd_info_id: z.number().int(),
  nickname: z.string(),
  mem_tp: z.enum(['p', 'e', 's']),
  userId: z.null(),
  musicpd_nickname: z.null(),
  attach_type: z.null(),
  regdate: z
    .string()
    .transform((timestamp) =>
      Temporal.Instant.fromEpochMilliseconds(Number(timestamp)),
    ),
  reaction_type: z.enum(['GOOD']).nullish(),
  connect_artist_id: z.number().int(),
  writer_type: z.enum(['user']),
  reply_cnt: z.number().int(),
  replies: z.union([z.null(), z.array(z.unknown())]),
  del_reason: z.literal(0),
  openid_postid: z.null(),
  content_title: z.null(),
  regdate_str: z.null(),
  good_cnt: z.number().int(),
  bad_cnt: z.number().int(),
  report_cnt: z.number().int(),
  deletable: z.boolean(),
  attach: z.null(),
  comment_source_type: z.null(),
  comment_source: z.null(),
  comment_id: z.number().int(),
  is_report: z.boolean(),
  is_musicpd: z.boolean(),
  attach_yn: z.enum(['N']),
  connect_artist_nickname: z.null(),
  connect_type: z.null(),
  is_connect_artist: z.boolean(),
  is_reaction: z.boolean(),
  content: z.string(),
  status: z.enum(['OK']),
});
export type Comment = z.infer<typeof Comment>;
