import { z } from 'zod';

export const CommonResponse = {
  withProperties: <T extends Record<string, z.ZodSchema>>(object: T) =>
    z.object({
      ...object,
      ret_code: z.literal(0),
      ret_msg: z.string(),
      ret_detail_msg: z.null(),
    }),
};
export type CommonResponse<T extends Record<string, z.ZodSchema>> = ReturnType<
  typeof CommonResponse.withProperties<T>
>;
