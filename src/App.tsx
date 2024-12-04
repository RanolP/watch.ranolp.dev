import * as d3 from 'd3';
import rawSnapshot from '../data/snapshot.json';
import { TMergedData } from '../lib/transport/merged-data';
import { createEffect, For } from 'solid-js';
import { windowHeightSignal, windowWidthSignal } from './signalswindow-size';

const snapshot = TMergedData.parse(rawSnapshot);

function App() {
  const widthSignal = windowWidthSignal();
  const heightSignal = windowHeightSignal();

  const width = () => Math.min(widthSignal(), (heightSignal() * 16) / 9);
  const height = () => Math.min(heightSignal(), (widthSignal() * 9) / 16);

  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 30;
  const marginLeft = 40;

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
      .range([marginLeft, width() - marginRight]);
  const y = () =>
    d3
      .scaleLinear()
      .domain([0, 5, 100])
      .range([
        height() - marginBottom,
        marginTop + (height() - marginBottom - marginTop) * 0.4,
        marginTop,
      ]);

  const count = Object.entries(snapshot.favorite.candidateData).length;
  const lines = () =>
    Object.entries(snapshot.favorite.candidateData)
      .sort(([a, _a], [b, _b]) => a.localeCompare(b))
      .map(([_id, data]) => {
        const line = d3
          .line<(typeof data)[number]>()
          .x(({ timestamp }) => x()(new Date(timestamp.epochMilliseconds)))
          .y(({ data }) => y()(data.votePercent));
        return line(data) ?? undefined;
      });

  const $xAxis = (<g />) as SVGGElement;
  createEffect(() =>
    d3
      .select($xAxis)
      .attr('transform', `translate(0, ${height() - marginBottom + marginTop})`)
      .call(d3.axisBottom(x())),
  );

  const $yAxis = (<g />) as SVGGElement;
  createEffect(() =>
    d3
      .select($yAxis)
      .attr('transform', `translate(${marginLeft}, ${marginTop})`)
      .call(d3.axisLeft(y())),
  );

  return (
    <div break-keep px-4 max-w-350 mx-auto text-balance flex="~ col">
      <h1 text-center text-12 font-bold>
        {snapshot.favorite.title}
      </h1>
      <p text-6 text-center whitespace-pre-line max-w-250 mx-auto>
        {snapshot.favorite.description}
      </p>
      <svg
        w-full
        p-10
        viewBox={`0 0 ${width() + marginLeft + marginRight} ${
          height() + marginTop + marginBottom
        }`}
      >
        <g class="[&_text]:text-[clamp(10px,1vw,24px)]">
          {$xAxis}
          {$yAxis}
        </g>
        <For each={lines()}>
          {(d, i) => (
            <path
              stroke={`hsl(${(360 * i()) / count} 60% 80%)`}
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
          {([_, dots], i) => (
            <For each={dots}>
              {({ timestamp, data }) => (
                <circle
                  cx={x()(new Date(timestamp.epochMilliseconds))}
                  cy={y()(data.votePercent)}
                  r="0.2vw"
                  fill={`hsl(${(360 * i()) / count} 60% 50%)`}
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
