import { Temporal } from 'temporal-polyfill';
import { getFavorite } from '../lib/bugs-api';
import { listComments } from '../lib/bugs-api/endpoints/list-comments';

import fs from 'node:fs/promises';
import { TCandidate, TDatapoint } from '../lib/transport';
import ky from 'ky';
import path from 'node:path';

const Favorites = {
  COMEBACK_AND_TREND_2024: {
    id: 2221,
  },
};

const favorite = await getFavorite({
  id: Favorites.COMEBACK_AND_TREND_2024.id,
});
const comments = await listComments({
  id: favorite.result.comment_group_id,
  sort: 'ilike',
});

await fs.mkdir('./public/bugs-images', { recursive: true });
await Promise.all(
  favorite.result.vote_candidates.map(async (candidate) => {
    const targetFile = path.join('./public/bugs-images', candidate.image.path);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    const url = `https://image.bugsm.co.kr/artist/images/180${candidate.image.path}`;
    const arrayBuffer = await ky.get(url).arrayBuffer();
    fs.writeFile(targetFile, Buffer.from(arrayBuffer));
  }),
);

const now = Temporal.Now.instant();
await fs.mkdir('./data/crawl/', { recursive: true });
await fs.writeFile(
  `./data/crawl/${now.epochMilliseconds}.json`,
  JSON.stringify({
    favorite: {
      title: favorite.result.title,
      description: favorite.result.description,
      beginAt: favorite.result.start_dt,
      endAt: favorite.result.end_dt,
      candidates: Object.fromEntries(
        favorite.result.vote_candidates.map((candidate) => [
          candidate.vote_candidate_id.toString(),
          {
            name: candidate.candidate_title,
            id: candidate.vote_candidate_id.toString(),
            imageUrl: candidate.image.path,
          } satisfies TCandidate,
        ]),
      ),
      candidateData: Object.fromEntries(
        favorite.result.vote_candidates.map((candidate) => [
          candidate.vote_candidate_id.toString(),
          {
            id: `${now.epochMilliseconds}_${candidate.vote_candidate_id}`,
            candidateId: candidate.vote_candidate_id.toString(),
            rank: candidate.vote_rank,
            votePercent: candidate.vote_percent,
            streamingPercent: candidate.streaming_percent,
            votePoints: candidate.vote_point,
          },
        ]),
      ),
    },
    comments: comments.list.map((comment) => ({
      id: comment.comment_id.toString(),
      nickname: comment.nickname,
      content: comment.content,

      upvotes: comment.good_cnt,
      createdAt: comment.regdate,
    })),
  } satisfies TDatapoint),
);
