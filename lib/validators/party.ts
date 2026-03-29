import { z } from "zod";

const coordinateField = z.string().trim().optional();

export const partySchema = z.object({
  departurePlaceName: z.string().trim().min(1, "출발지를 입력해주세요.").max(120),
  departureDetail: z.string().trim().max(120, "상세 위치는 120자 이하로 입력해주세요.").optional(),
  departureLat: coordinateField,
  departureLng: coordinateField,
  destinationPlaceName: z.string().trim().min(1, "도착지를 입력해주세요.").max(120),
  destinationLat: coordinateField,
  destinationLng: coordinateField,
  scheduledAt: z.string().trim().min(1, "출발 시간을 입력해주세요."),
  capacity: z.coerce.number().int().min(2, "정원은 2명 이상이어야 합니다.").max(4, "정원은 4명 이하만 가능합니다."),
  note: z.string().trim().max(300, "메모는 300자 이하로 입력해주세요.").optional(),
});
