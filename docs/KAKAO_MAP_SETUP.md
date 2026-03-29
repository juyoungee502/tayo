# Kakao 지도 설정 메모

이 프로젝트는 **Kakao Maps JavaScript SDK**를 사용한다.

## 코드 요구사항
- 카카오 지도 키는 `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`에서만 읽는다.
- SDK는 클라이언트에서만 로드한다.
- 로더 URL에는 아래 옵션을 포함한다.
  - `autoload=false`
  - `libraries=services`

예시 개념:
- `//dapi.kakao.com/v2/maps/sdk.js?appkey=...&autoload=false&libraries=services`

## 왜 JavaScript 키 1개만 쓰게 설계하나
이번 MVP는 **지도 표시 + 장소 검색**을 JavaScript SDK 중심으로 구현한다.
따라서 카카오맵 관련 코드는 `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`만 채우면 동작하도록 설계한다.

## 꼭 해야 하는 콘솔 설정
코드만 맞춰도 끝이 아니다. 카카오 개발자 콘솔에서 아래를 해야 한다.
- 앱 생성
- JavaScript 키 확인
- JavaScript SDK 도메인 등록

## 로컬/배포 도메인 예시
- `http://localhost:3000`
- 배포 주소(예: Vercel 도메인)
- 커스텀 도메인이 있다면 그것도 추가

## 실패 대응
아래 상황에서도 앱이 죽으면 안 된다.
- 키 누락
- 잘못된 키
- 도메인 미등록
- SDK 로드 실패

이 경우:
- 지도 컴포넌트 대신 수동 텍스트 입력 UI를 보여준다.
- 에러 원인을 안내하는 작은 도움말을 표시한다.
- 생성/수정/필터 기능은 텍스트 기반으로 계속 사용할 수 있어야 한다.

