# 타요 Codex 핸드오프 패키지

이 패키지는 **'타요' 택시 합승 웹 MVP**를 Codex에게 맡길 때 바로 붙여 넣고 사용할 수 있는 자료 모음입니다.

## 권장 사용 순서

1. 새 Git 저장소를 만들거나 기존 저장소를 엽니다.
2. 이 패키지의 `AGENTS.md`를 저장소 루트에 넣습니다.
3. `PRODUCT_SPEC.md`, `ACCEPTANCE_CRITERIA.md`, `KAKAO_MAP_SETUP.md`를 `docs/` 폴더에 넣습니다.
4. `.env.example`를 참고해 `.env.local` 파일을 만듭니다.
5. `PROMPT_MASTER.txt` 전체를 Codex에게 전달합니다.
6. 1차 구현이 끝나면 `PROMPT_HARDENING.txt`를 추가로 보내서 안정화/보완을 시킵니다.

## 이 패키지가 해결해 둔 것

- 기획서를 개발 명세서 형태로 재구성
- MVP 범위와 비범위를 분리
- 화면/DB/비즈니스 규칙 명확화
- 카카오맵은 **환경변수 1개(`NEXT_PUBLIC_KAKAO_MAP_APP_KEY`)만 채우면 동작하도록 요구사항 정의**
- 단, Supabase 프로젝트를 실제로 붙일 경우 Supabase URL/anon key는 별도로 필요
- 웹에서 “모임 종료 후 1시간 뒤 피드백 페이지 강제 노출” 요구사항은 현실적으로 **다음 방문 시 강제 모달/배너 표시** 방식으로 구체화

## 핵심 구현 방향

- 프론트엔드: Next.js App Router + TypeScript + Tailwind CSS
- 인증/DB: Supabase
- 지도/장소 검색: Kakao Maps JavaScript SDK + services 라이브러리
- 배포: Vercel
- 대상 학교: 가톨릭대학교 성심교정
- 학교 이메일 제한: `@catholic.ac.kr`

## 가장 중요한 원칙

1. **학교 인증 기반**
   - `@catholic.ac.kr` 이메일만 가입 허용
   - 관리자 계정은 회원가입 화면에서 만들지 않음

2. **한 번에 하나의 활성 택시팟만**
   - 사용자는 동시에 두 개 이상의 활성 택시팟에 참여할 수 없음

3. **지도 키 하드코딩 금지**
   - 카카오맵 키는 반드시 환경변수에서만 읽음

4. **지도 실패 시에도 앱이 죽으면 안 됨**
   - 키 미입력 / 도메인 미등록 / SDK 로드 실패 상황에서도
   - 수동 텍스트 입력으로 핵심 흐름이 유지되어야 함

5. **MVP에 집중**
   - 실시간 채팅, 자동 결제, 푸시 알림, 복잡한 운영 대시보드는 제외

## 포함 파일

- `PRODUCT_SPEC.md`
- `ACCEPTANCE_CRITERIA.md`
- `PROMPT_MASTER.txt`
- `PROMPT_HARDENING.txt`
- `AGENTS.md`
- `.env.example`
- `SUPABASE_SCHEMA.sql`
- `KAKAO_MAP_SETUP.md`

