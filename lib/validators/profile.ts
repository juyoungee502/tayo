import { z } from "zod";

export const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, "닉네임은 2자 이상이어야 합니다.")
    .max(20, "닉네임은 20자 이하로 입력해주세요."),
});

export const deletionRequestSchema = z.object({
  note: z.string().trim().max(300, "요청 메모는 300자 이하로 입력해주세요.").optional(),
});
