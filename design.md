# Korea Travel Concierge 디자인 시스템

## 방향

`Korea Travel Concierge`는 영상에서 추출한 장소를 수집하고 검수하는 운영 콘솔이다. 최신
`kor-travel-map` admin의 `Rail-Workbench` 구조를 기준으로 삼아, 좌측 전역 메뉴와 상단
작업 맥락을 고정하고 본문은 한 번에 한 작업을 처리하기 좋은 밀도로 유지한다.

- 스타일: 장식보다 상태 판독과 조작 순서를 우선하는 editorial-utilitarian 운영 화면
- 구조: 그룹형 전역 Rail → 현재 화면을 설명하는 header band → flat 작업면
- 반응형: 데스크톱은 16rem Rail, 접힘 상태는 4rem, 모바일은 가로 스크롤 메뉴로 전환
- 메뉴: `개요`, `수집 파이프라인`, `검수`, `시스템` 그룹과 현재 Concierge의 실제 route만 사용

## 색상과 표면

최신 레포의 구조와 컴포넌트 언어를 가져오되, Concierge의 현재 색상톤은 유지한다. 초록색
브랜드 팔레트로 교체하지 않는다.

- `--brand`: 보라 `#7c3aed`, hover/ink `#6d28d9`, tint `#ede9fe`
- `--shell-rail`: 짙은 보라 `#2e1065`, Rail 문자는 `--shell-rail-text` 계열
- `--surface-page`: 웜그레이 캔버스, `--surface-card`: 크림색 작업면
- `--line`/`--border`: 얇은 경계, `--control-line`: 입력·보조 CTA의 더 선명한 경계
- 기본 카드와 섹션은 그림자 없이 `border + rounded-panel`을 사용하고, 팝업만 `shadow-modal`을 사용
- 색상 토큰의 정본은 [`frontend/tokens.css`](frontend/tokens.css)이며 화면에 임의 hex를 추가하지 않는다

## 타이포그래피와 밀도

- 본문과 UI는 `Pretendard Variable`을 우선하고 시스템 한글 sans-serif를 fallback으로 둔다.
- 제목은 같은 서체의 굵기와 크기로 계층을 만들며, 한국어 라벨에는 억지로 `uppercase`와
  tracking을 적용하지 않는다.
- 기본 본문은 15px, 보조 문자는 13.5px/12px, 페이지 제목은 24px을 기준으로 한다.
- 표와 수치는 `tabular-nums`를 사용하고, 긴 값은 셀 안에서 줄바꿈·말줄임이 가능해야 한다.

## 레이아웃과 컴포넌트

- Rail은 제품명, 그룹 라벨, route 링크, 작업 상태, 로그아웃만 담당한다. 페이지 설명과 행동은
  header band에 둔다.
- header band는 `border-bottom` hairline으로 본문과 나누며, 섹션 라벨 → 제목/행동 → 설명 순서다.
- 컨트롤 높이는 `h-control` 36px과 `h-control-sm` 30px 두 종류만 사용한다. 기본 반경은
  `rounded-control` 6px, 패널 반경은 `rounded-panel` 8px이다.
- `Card`/`SectionCard`는 제목 밴드와 flat 본문을 제공한다. 카드 안에 또 다른 장식용 카드를
  중첩하지 않는다.
- KPI는 아이콘 타일을 반복하지 않고 `StatStrip`의 숫자·라벨·hairline 조합으로 표현한다.
- 표·선택 목록·지도는 각각 하나의 containment만 가지며, 좁은 화면에서는 가로 스크롤을 명시한다.
- Dialog/AlertDialog/Popover는 동일한 overlay·motion·panel 레시피를 공유한다.

## 상태와 접근성

- active는 색상만이 아니라 `aria-current`와 좌측 2px 보라 mark로 구분한다.
- 상태는 색상만으로 전달하지 않고 text와 함께 표시하며, 상태 tint는 불투명 semantic token을 쓴다.
- focus-visible은 즉시 보이는 2px 보라 outline을 사용한다. 아이콘 전용 버튼에는 이름과 title을 제공한다.
- 로딩 버튼은 라벨 위치와 접근성 이름을 유지한 채 spinner를 겹쳐 표시한다.
- `prefers-reduced-motion`에서는 전환·scale을 줄이되 진행 중 spinner는 유지한다.
- 모바일 320px부터 메뉴·표·dialog가 문서 전체 가로 스크롤을 만들지 않아야 한다.
