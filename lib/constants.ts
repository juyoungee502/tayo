export const SCHOOL_NAME = "가톨릭대학교 성심교정";
export const APP_NAME = "타요";
export const FEEDBACK_DELAY_HOURS = 1;
export const ALLOWED_LOGIN_EMAIL_DOMAINS = ["catholic.ac.kr", "korea.ac.kr", "gmail.com"] as const;
export const ALLOWED_LOGIN_EMAIL_LABEL = ALLOWED_LOGIN_EMAIL_DOMAINS.map((domain) => `@${domain}`).join(", ");
export const DEFAULT_DESTINATION = {
  placeName: SCHOOL_NAME,
  lat: 37.486987,
  lng: 126.801415,
};
export const REPORT_REASON_OPTIONS = [
  { value: "late", label: "지각" },
  { value: "no_show", label: "노쇼" },
  { value: "unsafe_behavior", label: "위험한 행동" },
  { value: "rude_behavior", label: "불쾌한 태도" },
  { value: "other", label: "기타" },
] as const;
