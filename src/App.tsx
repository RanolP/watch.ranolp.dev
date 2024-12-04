import * as d3 from 'd3';
import rawSnapshot from '../data/snapshot.json';
import { TMergedData } from '../lib/transport/merged-data';
import { createEffect, For } from 'solid-js';
import { windowHeightSignal, windowWidthSignal } from './signalswindow-size';

const snapshot = TMergedData.parse(rawSnapshot);

const hueMap = Object.fromEntries(
  Object.keys(snapshot.favorite.candidates).map((id, idx, arr) => [
    id,
    (360 * idx) / arr.length,
  ]),
);

const last = Object.fromEntries(
  Object.entries(snapshot.favorite.candidateData).map(([id, value]) => [
    id,
    value.at(-1)!,
  ]),
);

function App() {
  const widthSignal = windowWidthSignal();
  const heightSignal = windowHeightSignal();

  const width = () => Math.min(widthSignal(), (heightSignal() * 16) / 9);
  const height = () => Math.min(heightSignal(), (widthSignal() * 9) / 16);

  const marginTop = () => 5;
  const marginBottom = () => 20;
  const marginLeft = () => 50;

  const x = () =>
    d3
      .scaleTime()
      .domain([
        new Date(
          snapshot.recordedTimeRange.begin.epochMilliseconds - 1000 * 60 * 5,
        ),
        new Date(
          snapshot.recordedTimeRange.end.epochMilliseconds + 1000 * 60 * 5,
        ),
      ])
      .range([marginLeft(), width()]);
  const y = () =>
    d3
      .scaleLinear()
      .domain([0, 5, 100])
      .range([
        height() - marginBottom(),
        marginTop() + (height() - marginBottom() - marginTop()) * 0.4,
        marginTop(),
      ]);

  const lines = () =>
    Object.entries(snapshot.favorite.candidateData)
      .sort(([a, _a], [b, _b]) => a.localeCompare(b))
      .map(([id, data]) => {
        const line = d3
          .line<(typeof data)[number]>()
          .x(({ timestamp }) => x()(new Date(timestamp.epochMilliseconds)))
          .y(({ data }) => y()(data.votePercent));
        return { id, d: line(data) ?? undefined };
      });

  const $xAxis = (<g />) as SVGGElement;
  createEffect(() =>
    d3
      .select($xAxis)
      .attr(
        'transform',
        `translate(0, ${height() - marginBottom() + marginTop()})`,
      )
      .call(d3.axisBottom(x())),
  );

  const $yAxis = (<g />) as SVGGElement;
  createEffect(() =>
    d3
      .select($yAxis)
      .attr('transform', `translate(${marginLeft()}, ${marginTop()})`)
      .call(d3.axisLeft(y())),
  );

  return (
    <div break-keep my-4 px-4 max-w-350 mx-auto text-balance flex="~ col">
      <h1 text-center text-12 font-bold>
        {snapshot.favorite.title}
      </h1>
      <p text-5 text-center whitespace-pre-line max-w-250 mx-auto>
        {snapshot.favorite.description}
      </p>
      <ol flex="~ row wrap" gap-3 m-3>
        <For
          each={Object.values(snapshot.favorite.candidates)
            .sort((a, b) => last[a.id].data.rank - last[b.id].data.rank)
            .map((candidate) => ({
              candidate,
              datapoint: last[candidate.id].data,
            }))}
        >
          {({ candidate, datapoint }) => (
            <li
              inline-block
              border-1
              border-black
              border-rounded-md
              p-2
              w-60
              h-35
              flex="~ col"
            >
              <h3>
                <span
                  style={{ background: `hsl(${hueMap[candidate.id]} 60% 80%)` }}
                  border-rounded-full
                  w-6
                  h-6
                  inline-flex
                  justify-center
                  items-center
                  p-2
                >
                  {datapoint.rank}
                </span>{' '}
                {candidate.name}
              </h3>
              <div flex="~ row 1">
                <p p-2 flex-1>
                  투표 {datapoint.votePercent}% ({datapoint.votePoints}) <br />
                  스밍 {datapoint.streamingPercent}% <br />
                </p>
                <img
                  rounded-md
                  w-20
                  h-20
                  aspect-ratio-square
                  object-cover
                  self-end
                  src={`${import.meta.env.BASE_URL}bugs-images${
                    candidate.imageUrl
                  }`}
                />
              </div>
            </li>
          )}
        </For>
      </ol>
      <svg
        w-full
        viewBox={`0 0 ${width() + marginLeft()} ${
          height() + marginTop() + marginBottom()
        }`}
      >
        <g class="[&_text]:text-[clamp(10px,1vw,24px)]">
          {$xAxis}
          {$yAxis}
        </g>
        <For each={lines()}>
          {({ id, d }) => (
            <path
              stroke={`hsl(${hueMap[id]} 60% 80%)`}
              stroke-width="clamp(2px, 0.4vw, 16px)"
              fill="none"
              d={d}
            />
          )}
        </For>
        <For
          each={Object.entries(snapshot.favorite.candidateData).sort(
            ([a, _a], [b, _b]) => a.localeCompare(b),
          )}
        >
          {([_, dots]) => (
            <For each={dots}>
              {({ timestamp, data }) => (
                <circle
                  cx={x()(new Date(timestamp.epochMilliseconds))}
                  cy={y()(data.votePercent)}
                  r="0.2vw"
                  fill={`hsl(${hueMap[data.candidateId]} 60% 50%)`}
                />
              )}
            </For>
          )}
        </For>
      </svg>
    </div>
  );
}

export default App;
