import * as d3 from 'd3';
import rawSnapshot from '../data/snapshot.json';
import { TMergedData } from '../lib/transport/merged-data';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { windowHeightSignal, windowWidthSignal } from './signalswindow-size';
import { TCandidate, TCandidateData } from '../lib/transport';
import { useFloating } from 'solid-floating-ui';
import { autoPlacement, offset, shift, VirtualElement } from '@floating-ui/dom';
import { Temporal } from 'temporal-polyfill';
import { josa } from 'es-hangul';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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

interface Props {
  showStreaming: boolean;
}
function App(props: Props) {
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
  // const viewWidth = () =>
  //   Math.max(
  //     800,
  //     Math.min(widthSignal(), 1400 - 32, (heightSignal() * 16) / 9),
  //   );
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

  // 241204 COMEBACK & TREND
  // const yDomains = [0, 4, 20, 50] as const;
  // const yPercentages = [0, 0.6, 0.74, 1];

  // HAPPY NEW YEAR 2024
  // const yDomains = [0, 40] as const;
  // const yPercentages = [0, 1] as const;

  const yDomains = [0, 20, 70, 75] as const;
  const yPercentages = [0, 0.8, 0.84, 1] as const;
  const y = () =>
    d3
      .scaleLinear()
      .domain(yDomains)
      .range(
        yPercentages.map(
          (x) =>
            (height() - marginBottom() - marginTop()) * (1 - x) + marginTop(),
        ),
      );

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
      .call(d3.axisLeft(y()).tickValues(yDomains)),
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

  const accVotePoints = Object.values(last).reduce(
    (acc, curr) => acc + curr.data.votePoints,
    0,
  );

  const [percentPoint, setPercentPoint] = createSignal<number>(1);
  const [selection, setSelection] = createSignal<number>(0);
  const planPercentPoint = () =>
    Math.ceil(
      (percentPoint() * (accVotePoints * accVotePoints)) /
        ((80 - percentPoint()) * accVotePoints -
          80 * candidatesRank[selection()].datapoint.votePoints),
    );
  const check$ = (<div mt-5 w-fit mx-auto />) as HTMLDivElement;
  createEffect(() => {
    const { candidate, datapoint } = candidatesRank[selection()];
    const tex = String.raw`
    \begin{align}
      ${(
        (80 * datapoint.votePoints) / accVotePoints +
        datapoint.streamingPercent
      ).toFixed(1)} \% &= 80\% \times \frac{투표수_{${
      candidate.name
    }}}{투표수_{전체}}${
      props.showStreaming ? String.raw` + {스트리밍_{${candidate.name}}}\%` : ''
    }
    \nonumber \\ &=
    80\% \times \frac{${datapoint.votePoints}}{${accVotePoints}}${
      props.showStreaming ? String.raw` + ${datapoint.streamingPercent}\%` : ''
    } 
    \nonumber \\
    
    ${(
      (80 * datapoint.votePoints) / accVotePoints +
      datapoint.streamingPercent
    ).toFixed(1)} \% + ${percentPoint()}\% &= 80\% \times \frac{투표수_{${
      candidate.name
    }} + 투표수_{신규}}{투표수_{전체} + 투표수_{신규}}${
      props.showStreaming ? String.raw`+ {스트리밍_{${candidate.name}}} \%` : ''
    }
    \nonumber \\ &= 80\% \times \frac{${
      datapoint.votePoints
    } + ${planPercentPoint()}}{${accVotePoints} + ${planPercentPoint()}}${
      props.showStreaming ? String.raw` + ${datapoint.streamingPercent}\%` : ''
    }
    \nonumber \\ &= 80\% \times \frac{${
      datapoint.votePoints + planPercentPoint()
    }}{${accVotePoints + planPercentPoint()}}${
      props.showStreaming ? String.raw` + ${datapoint.streamingPercent}\%` : ''
    }
    \nonumber \\ &= ${(
      (80 * (datapoint.votePoints + planPercentPoint())) /
        (accVotePoints + planPercentPoint()) +
      datapoint.streamingPercent
    ).toFixed(1)}\% =  ${(
      (80 * datapoint.votePoints) / accVotePoints +
      datapoint.streamingPercent
    ).toFixed(1)} \% + ${percentPoint()}\%
    \nonumber 
    \end{align}
    `;
    katex.render(tex, check$, { displayMode: true });
  });

  return (
    <div break-keep my-4 px-4 max-w-350 mx-auto text-balance flex="~ col">
      <h1 text-center text-6 md:text-12 font-bold>
        {snapshot.favorite.title}
      </h1>
      <p
        text-center
        text-4
        md:text-5
        whitespace-pre-line
        max-w-250
        mx-auto
        text-gray-7
      >
        {snapshot.favorite.description}
      </p>
      <p
        text-center
        text-5
        md:text-6
        max-w-250
        mx-auto
        mt-6
        text-cyan-7
        font-bold
      >
        진행 기간 <br />
        {snapshot.favorite.beginAt.toLocaleString('ko-KR')} ~{' '}
        {snapshot.favorite.endAt.toLocaleString('ko-KR')}
      </p>
      <hr my-5 />
      <p text-center text-4 md:text-5>
        누적 표 수 : {new Intl.NumberFormat('ko-KR').format(accVotePoints)}
        <br />
        <select
          name="1%p-select"
          onChange={(e) => setSelection(Number(e.target.value))}
        >
          {candidatesRank.map(({ candidate }, idx) => (
            <option value={idx}>{candidate.name}</option>
          ))}
        </select>
        {josa.pick(
          candidatesRank[selection()].candidate.name.replace(/[^가-힣]+/, ''),
          '이/가',
        )}{' '}
        <input
          w-15
          type="number"
          step={0.1}
          value={percentPoint()}
          onChange={(e) => setPercentPoint(e.target.valueAsNumber)}
        />
        %p를 올리기 위해선 약{' '}
        {new Intl.NumberFormat('ko-KR').format(planPercentPoint())} 표 필요
        <br />
        {check$}
        <br />
        표당{' '}
        {new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: 'KRW',
          maximumFractionDigits: 1,
        }).format((135000 / 13000) * 20)}
        <sup>골드하트 13,000개/₩135,000</sup>~
        {new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: 'KRW',
          maximumFractionDigits: 1,
        }).format((1350 / 100) * 20)}
        <sup>골드하트 100개/₩1,350</sup>
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
              <h3 p-1 md:p-2 overflow-x-clip text-ellipsis>
                <span
                  font-bold
                  md:text-5
                  text-4
                  whitespace-pre
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
                        %p
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
                  {props.showStreaming && (
                    <>
                      스밍 {datapoint.streamingPercent}% <br />
                    </>
                  )}
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
                          current.timestamp.until(cursor).seconds /
                          total.seconds,
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
                    {props.showStreaming && (
                      <>
                        {target.points[0].data.streamingPercent.toFixed(1)}%
                        스밍{' '}
                        {target.deltaStreamingPercent
                          ? target.deltaStreamingPercent > 0
                            ? `(${target.deltaStreamingPercent.toFixed(
                                1,
                              )}%p 상승)`
                            : `(${-target.deltaStreamingPercent.toFixed(
                                1,
                              )}%p 하락)`
                          : null}{' '}
                      </>
                    )}
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
                    {props.showStreaming && (
                      <>
                        평균{' '}
                        {target.points
                          .reduce(
                            (acc, curr) =>
                              acc +
                              curr.data.streamingPercent * curr.percentage,
                            0,
                          )
                          .toFixed(1)}
                        % 스밍
                      </>
                    )}
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
