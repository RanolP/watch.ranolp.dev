import { z } from 'zod';

export class Color {
  static zod = z.string().transform((value) => new Color(value));
  constructor(readonly value: string) {}
}
