import ky from 'ky';
import { z } from 'zod';
import { CommonResponse } from '../entities/common-response';
import { Favorite, zext } from '../entities';

interface Params {
  id: number;
}
export const getFavorite = ({ id }: Params) =>
  ky
    .get(`https://favorite.bugs.co.kr/favorite-api/v1/favorite/info/${id}`, {
      headers: { Referer: 'https://favorite.bugs.co.kr/' },
    })
    .json()
    .then((value) => Response.parse(value));

const Response = CommonResponse.withProperties({
  result: Favorite,
  info: z.object({
    server_time: zext.instant.epochMillis.int(),
    list_identity: z.object({
      style: z.enum(['favorite_info']),
      id: z.string(),
    }),
  }),
});
