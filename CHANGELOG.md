# 변경 기록

## 2026-09-01

### Added

- 종료된 작업을 `/jobs`에서 삭제하고, 연결된 재시작·후속 작업이 있으면 삭제를 막는다.
- YouTube API와 작업 실패의 상세 원인을 작업 상세 화면에서 확인한다.
- Prometheus `/metrics` endpoint와 HTTP·작업 상태·오류 종류 지표를 제공한다.

### Changed

- 사이트명, 로그인 화면, 메뉴 상단 이름을 `Travel Concierge Admin UI`로 통일했다.
- `kor-travel-map` 최신 admin UI의 구조·컴포넌트 언어를 반영하되 기존 보라색 색상톤을 유지했다.
