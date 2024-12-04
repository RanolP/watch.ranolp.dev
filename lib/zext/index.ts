import { Temporal } from 'temporal-polyfill';
import { z } from 'zod';

export const zext = {
  instant: {
    epochMillis: {
      int: Object.assign(
        () =>
          z
            .number()
            .int()
            .describe('Instant.fromEpochMilliseconds')
            .transform((value) =>
              Temporal.Instant.fromEpochMilliseconds(value),
            ),
        {
          nullIfZero: () =>
            z
              .number()
              .int()
              .describe('Instant.fromEpochMilliseconds')
              .transform((value) => {
                if (value === 0) return null;
                return Temporal.Instant.fromEpochMilliseconds(value);
              }),
        },
      ),
    },
    iso: {
      string: () =>
        z.string().transform((value) => Temporal.Instant.from(value)),
    },
  },
};
