import { z } from "zod";

export const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, "닉네임은 2자 이상이어야 합니다.")
    .max(20, "닉네임은 20자 이하로 입력해주세요."),
  department: z
    .string()
    .trim()
    .max(40, "학과는 40자 이하로 입력해주세요.")
    .optional(),
  studentNumber: z
    .string()
    .trim()
    .max(20, "학번은 20자 이하로 입력해주세요.")
    .optional(),
  profileMessage: z
    .string()
    .trim()
    .max(60, "상태메시지는 60자 이하로 입력해주세요.")
    .optional(),
});

export const deletionRequestSchema = z.object({
  note: z.string().trim().max(300, "요청 메모는 300자 이하로 입력해주세요.").optional(),
});
