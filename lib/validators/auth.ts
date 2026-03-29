import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("올바른 이메일 형식을 입력해주세요."),
});
