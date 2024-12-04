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

  const width = () =>
    Math.max(
      800,
      Math.min(widthSignal(), 1400 - 32, (heightSignal() * 16) / 9),
    );
  const height = () =>
    Math.max(
      (800 * 9) / 16,
      Math.min(
        heightSignal(),
        ((1400 - 32) * 9) / 16,
        (widthSignal() * 9) / 16,
      ),
    );

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
      .domain([0, 4, 20, 50])
      .range([
        height() - marginBottom(),
        marginTop() + (height() - marginBottom() - marginTop()) * 0.4,
        marginTop() + (height() - marginBottom() - marginTop()) * 0.36,
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
      .call(d3.axisLeft(y()).tickValues([0, 4, 20, 50])),
  );

  const candidatesRank = Object.values(snapshot.favorite.candidates)
    .sort((a, b) => last[a.id].data.rank - last[b.id].data.rank)
    .map((candidate) => ({
      candidate,
      datapoint: last[candidate.id].data,
    }));

  return (
    <div break-keep my-4 px-4 max-w-350 mx-auto text-balance flex="~ col">
      <h1 text-center text-6 md:text-12 font-bold>
        {snapshot.favorite.title}
      </h1>
      <p text-center text-4 md:text-5 whitespace-pre-line max-w-250 mx-auto>
        {snapshot.favorite.description}
      </p>
      <ol flex="~ row wrap" gap-3 m-3 w-full justify-center>
        <For each={candidatesRank}>
          {({ candidate, datapoint }, i) => (
            <li
              inline-block
              border-1
              border-black
              border-rounded-md
              p-2
              md="w-60 h-42"
              w-44
              h-30
              flex="~ col"
            >
              <h3 p-1 md:p-2>
                <span
                  font-bold
                  md:text-5
                  text-4
                  class="tracking--0.5"
                  md="tracking-normal"
                >
                  {datapoint.rank}. {candidate.name}
                </span>{' '}
                <span
                  style={{
                    background: `hsl(${hueMap[candidate.id]} 60% 80%)`,
                  }}
                  border-rounded-full
                  inline-flex
                  justify-center
                  items-center
                  px-1
                  text-3
                  md:mx="-0.7"
                  vertical-mid
                  md:vertical-super
                >
                  {datapoint.votePercent}%
                </span>
                <small block h-2>
                  {i() > 0 ? (
                    <>
                      순위 역전까지{' '}
                      {(
                        candidatesRank[i() - 1].datapoint.votePercent -
                        datapoint.votePercent
                      ).toFixed(2)}
                      %!
                    </>
                  ) : (
                    <>지켜야 한다...!</>
                  )}
                </small>
              </h3>
              <div flex="~ row 1" text-4>
                <p p-1 md:p-2 flex-1>
                  투표 {datapoint.votePoints} <br />
                  스밍 {datapoint.streamingPercent}% <br />
                </p>
                <img
                  rounded-md
                  w-14
                  h-14
                  md="w-20 h-20"
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
      <div max-w-full overflow-x-auto>
        <svg
          width={width()}
          height={height()}
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
    </div>
  );
}

export default App;
