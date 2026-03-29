import { z } from "zod";

export const feedbackSchema = z.object({
  punctualityRating: z.coerce.number().int().min(1).max(5),
  comfortRating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500, "후기는 500자 이하로 입력해주세요.").optional(),
});
