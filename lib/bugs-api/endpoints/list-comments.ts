import { z } from 'zod';
import { Comment } from '../entities';
import { Pager } from '../entities';
import ky from 'ky';
import { CommentGroupId } from '../entities';
import { CommonResponse } from '../entities/common-response';

interface GetCommentsParams {
  id: CommentGroupId;
  page?: number;
  size?: number;
  sort?: 'regdate' | 'ilike';
}

export const listComments = ({
  id: { value: id },
  page = 1,
  size = 5,
  sort = 'regdate',
}: GetCommentsParams) =>
  ky
    .get(`https://favorite.bugs.co.kr/comment-api/${id}`, {
      searchParams: { page, size, sort },
    })
    .json()
    .then((value) => Response.parse(value));

const Response = CommonResponse.withProperties({
  pager: Pager,
  list: z.array(Comment),
  info: z.object({
    reply_count: z.number().int(),
    list_identity: z.object({
      style: z.enum(['comment_attach_music']),
      id: z.string(),
    }),
  }),
});
