import * as d3 from 'd3';
import rawSnapshot from '../data/snapshot.json';
import { TMergedData } from '../lib/transport/merged-data';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { windowHeightSignal, windowWidthSignal } from './signalswindow-size';
import { TCandidate, TCandidateData } from '../lib/transport';
import { useFloating } from 'solid-floating-ui';
import { autoPlacement, offset, shift, VirtualElement } from '@floating-ui/dom';
import { Temporal } from 'temporal-polyfill';

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

  const minWidth =
    1200 *
    snapshot.recordedTimeRange.begin
      .until(snapshot.recordedTimeRange.end)
      .total('days');

  const width = () =>
    Math.max(
      minWidth,
      Math.min(widthSignal(), 1400 - 32, (heightSignal() * 16) / 9),
    );
  // TODO: 줌 나중에?
  const _viewWidth = () =>
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

  const [lastHoverTarget, setLastHoverTarget] = createSignal<{
    candidate: TCandidate;
    points: Array<{ data: TCandidateData; percentage: number }>;
    deltaVotePoints?: number;
    deltaStreamingPercent?: number;
    timestamp: Temporal.Instant;
    duration?: Temporal.Duration;
    virtualEl: VirtualElement;
  } | null>(null);
  const [floating, setFloating] = createSignal<HTMLDivElement | null>(null);
  const position = useFloating(
    () => lastHoverTarget()?.virtualEl,
    () => floating(),
    {
      placement: 'top',
      middleware: [autoPlacement(), shift(), offset(10)],
    },
  );

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
                      <b
                        font-bold
                        style={{
                          color: `hsl(${hueMap[candidate.id]} 70% 30%)`,
                        }}
                      >
                        {(
                          candidatesRank[i() - 1].datapoint.votePercent -
                          datapoint.votePercent
                        ).toFixed(2)}
                        %
                      </b>
                      !
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
      <div
        max-w-full
        overflow-x-auto
        ref={(e) => {
          requestAnimationFrame(() => {
            e.scrollBy({ left: e.scrollWidth });
          });
        }}
      >
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
                onMouseMove={(e) => {
                  const cursor = Temporal.Instant.from(
                    x().invert(d3.pointer(e)[0]).toISOString(),
                  );
                  const index = snapshot.favorite.candidateData[id].findIndex(
                    ({ timestamp }) => cursor.until(timestamp).sign > 0,
                  );
                  const { [index - 1]: current, [index]: next } =
                    snapshot.favorite.candidateData[id];

                  const virtualEl: VirtualElement = {
                    getBoundingClientRect() {
                      return {
                        x: e.clientX,
                        left: e.clientX - 20,
                        right: e.clientX + 20,
                        width: 40,

                        y: e.clientY,
                        top: e.clientY - 20,
                        bottom: e.clientY + 20,
                        height: 40,
                      };
                    },
                  };
                  if (current && next) {
                    const total = current.timestamp.until(next.timestamp);
                    const points = [
                      {
                        data: current.data,
                        percentage:
                          1 -
                          current.timestamp.until(cursor).seconds /
                            total.seconds,
                      },
                      {
                        data: next.data,
                        percentage:
                          1 -
                          cursor.until(next.timestamp).seconds / total.seconds,
                      },
                    ];
                    setLastHoverTarget({
                      candidate: snapshot.favorite.candidates[id],
                      points,
                      virtualEl,
                      timestamp: cursor,
                    });
                  } else if (current || next) {
                    let e = current ?? next;
                    setLastHoverTarget({
                      candidate: snapshot.favorite.candidates[id],
                      points: [{ data: e.data, percentage: 1 }],
                      virtualEl,
                      timestamp: cursor,
                    });
                  }
                }}
                onMouseLeave={() => setLastHoverTarget(null)}
              />
            )}
          </For>
          <For
            each={Object.entries(snapshot.favorite.candidateData).sort(
              ([a, _a], [b, _b]) => a.localeCompare(b),
            )}
          >
            {([id, dots]) => (
              <For each={dots}>
                {({ timestamp, data }, i) => (
                  <circle
                    cx={x()(new Date(timestamp.epochMilliseconds))}
                    cy={y()(data.votePercent)}
                    r="0.2vw"
                    fill={`hsl(${hueMap[data.candidateId]} 60% 50%)`}
                    onMouseMove={(e) => {
                      const virtualEl: VirtualElement = {
                        getBoundingClientRect() {
                          return {
                            x: e.clientX,
                            left: e.clientX - 20,
                            right: e.clientX + 20,
                            width: 40,

                            y: e.clientY,
                            top: e.clientY - 20,
                            bottom: e.clientY + 20,
                            height: 40,
                          };
                        },
                      };
                      setLastHoverTarget({
                        candidate: snapshot.favorite.candidates[id],
                        points: [{ data, percentage: 1 }],
                        deltaVotePoints:
                          i() > 0
                            ? data.votePoints - dots[i() - 1].data.votePoints
                            : undefined,
                        deltaStreamingPercent:
                          i() > 0
                            ? data.streamingPercent -
                              dots[i() - 1].data.streamingPercent
                            : undefined,
                        duration:
                          i() > 0
                            ? dots[i() - 1].timestamp.until(timestamp)
                            : undefined,
                        timestamp,
                        virtualEl,
                      });
                    }}
                    onMouseLeave={() => setLastHoverTarget(null)}
                  />
                )}
              </For>
            )}
          </For>
        </svg>
        <Show when={lastHoverTarget() !== null}>
          {(() => {
            const target = lastHoverTarget();
            if (!target) return null;

            return (
              <div
                ref={setFloating}
                p-2
                z-100
                bg-white
                rounded-md
                shadow-md
                shadow-gray
                style={{
                  position: position.strategy,
                  top: `${position.y ?? 0}px`,
                  left: `${position.x ?? 0}px`,
                }}
              >
                <b
                  font-bold
                  style={{
                    color: `hsl(${hueMap[target.candidate.id]} 60% 40%)`,
                  }}
                >
                  {target.candidate.name}{' '}
                </b>{' '}
                (
                {(() => {
                  const datetime =
                    target.timestamp.toZonedDateTimeISO('Asia/Seoul');

                  return `${datetime.month}/${datetime.day} ${datetime.hour
                    .toString()
                    .padStart(2, '0')}:${datetime.minute
                    .toString()
                    .padStart(2, '0')}`;
                })()}
                {target.duration &&
                  `, ${target.duration.total('minutes').toFixed(1)}분 간`}
                )
                <br />
                {target.points.length === 1 ? (
                  <p>
                    {target.points[0].data.votePoints}표{' '}
                    {target.deltaVotePoints
                      ? `(${target.deltaVotePoints}표 상승)`
                      : null}{' '}
                    <br />
                    {target.points[0].data.streamingPercent.toFixed(1)}% 스밍{' '}
                    {target.deltaStreamingPercent
                      ? target.deltaStreamingPercent > 0
                        ? `(${target.deltaStreamingPercent.toFixed(1)}% 상승)`
                        : `(${-target.deltaStreamingPercent.toFixed(1)}% 하락)`
                      : null}{' '}
                  </p>
                ) : (
                  <p>
                    평균{' '}
                    {target.points
                      .reduce(
                        (acc, curr) =>
                          acc + curr.data.votePoints * curr.percentage,
                        0,
                      )
                      .toFixed(1)}
                    표 <br />
                    평균{' '}
                    {target.points
                      .reduce(
                        (acc, curr) =>
                          acc + curr.data.streamingPercent * curr.percentage,
                        0,
                      )
                      .toFixed(1)}
                    % 스밍
                  </p>
                )}
              </div>
            );
          })()}
        </Show>
      </div>
    </div>
  );
}

export default App;
