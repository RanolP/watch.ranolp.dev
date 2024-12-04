import { z } from 'zod';

export class CommentGroupId {
  static zod = z.number().transform((value) => new CommentGroupId(value));

  constructor(readonly value: number) {}
}
