import fs from 'node:fs/promises';
import { TDatapoint } from '../lib/transport';
import { TMergedData } from '../lib/transport/merged-data';
import path from 'node:path';
import { Temporal } from 'temporal-polyfill';
import { groupBy } from 'es-toolkit';

const files = await Array.fromAsync(fs.glob('./data/crawl/*.json'));
const datapoints = await Promise.all(
  files.map(async (p) => ({
    timestamp: Temporal.Instant.fromEpochMilliseconds(
      Number(path.parse(p).name),
    ),
    data: TDatapoint.parse(
      JSON.parse(await fs.readFile(p, { encoding: 'utf-8' })),
    ),
  })),
);
const last = datapoints.at(-1);
if (!last) throw new Error('no data found');

await fs.mkdir('./data/', { recursive: true });
await fs.writeFile(
  './data/snapshot.json',
  JSON.stringify({
    recordedTimeRange: { begin: datapoints[0].timestamp, end: last.timestamp },
    favorite: {
      title: last.data.favorite.title,
      description: last.data.favorite.description,
      beginAt: last.data.favorite.beginAt,
      endAt: last.data.favorite.endAt,
      candidates: last.data.favorite.candidates,
      candidateData: groupBy(
        datapoints
          .flatMap(({ timestamp, data }) =>
            Object.values(data.favorite.candidateData).map((data) => ({
              timestamp,
              data,
            })),
          )
          .toSorted(
            (a, b) =>
              a.timestamp.epochMilliseconds - b.timestamp.epochMilliseconds,
          ),
        ({ data }) => data.candidateId,
      ),
    },
    comments: last.data.comments,
  } satisfies TMergedData),
);
