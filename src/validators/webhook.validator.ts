import { z } from "zod";

export const webhookSchema = z.object({
  from: z.string(),
  message: z.string().min(1),
});
