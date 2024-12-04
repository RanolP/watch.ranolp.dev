import { z } from 'zod';

export const Pager = z.object({
  next_page: z.number().int(),
  set_size: z.number().int(),
  first_page: z.number().int(),
  prev_page: z.number().int(),
  page: z.number().int(),
  last: z.boolean(),
  total_count: z.number().int(),
  first: z.boolean(),
  page_size: z.number().int(),
  last_page: z.number().int(),
  remain_count: z.number().int(),
  webPager: z.object({
    setSize: z.number().int(),
    page: z.number().int(),
    last: z.boolean(),
    first: z.boolean(),
    nextPage: z.number().int(),
    remainCount: z.number().int(),
    totalCount: z.number().int(),
    pageSize: z.number().int(),
    firstPage: z.number().int(),
    lastPage: z.number().int(),
    prevPage: z.number().int(),
    list: z.array(z.number().int()),
  }),
  list: z.array(z.number().int()),
});

export type Pager = z.infer<typeof Pager>;
