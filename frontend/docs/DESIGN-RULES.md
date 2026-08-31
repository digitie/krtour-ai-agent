# 운영 콘솔 UI 디자인 규칙

이 문서는 최신 `kor-travel-map` admin의 UI 언어를 `kor-travel-concierge`에 적용하는 기준이다.
구조·밀도·상태 표현은 맞추되, 색상은 Concierge의 현재 보라색 팔레트를 유지한다.

## 적용 원칙

1. 화면은 `Rail-Workbench` 구조를 따른다. Rail에는 그룹형 전역 메뉴, 본문 header에는 현재
   작업의 제목·설명·행동, 본문에는 실제 작업면을 둔다.
2. 메뉴 그룹은 `개요`, `수집 파이프라인`, `검수`, `시스템`을 사용한다. 현재 저장소에 없는
   기준 레포 route를 임의로 추가하지 않는다.
3. 공용 색상은 `frontend/tokens.css`의 semantic token만 사용한다. `--brand`는
   `#7c3aed`, hover는 `#6d28d9`, tint는 `#ede9fe`이며 초록색으로 바꾸지 않는다.
4. 일반 영역은 `border + rounded-panel` 한 겹으로 표현하고 기본 shadow를 생략한다. modal과
   popover만 지정된 shadow를 사용한다.
5. 컨트롤은 `h-control`(36px)과 `h-control-sm`(30px) 두 높이를 사용하고, 반경은
   `rounded-control`(6px) 또는 `rounded-panel`(8px)로 통일한다.
6. 본문·폼·표는 `Pretendard Variable`을 우선한다. 기본 문자는 15px, 보조 문자는 13.5px/12px,
   페이지 제목은 24px을 사용한다. 한국어 라벨에는 `uppercase`와 불필요한 tracking을 붙이지 않는다.
7. 수치와 표에는 `tabular-nums`를 사용한다. 긴 값은 overflow를 만들지 않고 wrap 또는 truncate한다.
8. KPI는 아이콘 타일이 반복되는 카드 격자 대신 숫자·라벨·hairline을 가진 `StatStrip`을 사용한다.
9. 상태는 색상과 문자를 함께 표시한다. active nav는 `aria-current="page"`와 좌측 2px brand mark를
   함께 사용한다.
10. focus-visible은 2px 불투명 brand outline으로 즉시 표시한다. 로딩 버튼은 라벨을 유지하고
    spinner를 겹쳐 표시하며, reduced motion에서도 진행 상태를 잃지 않는다.

## 반응형 규칙

- 데스크톱 Rail은 16rem, 접힘 상태는 4rem이다.
- 모바일 Rail은 그룹 라벨과 링크가 가로 스크롤되는 한 줄 메뉴로 바뀌며, 활성 링크가 자동으로 보인다.
- 본문은 320px·375px·414px·768px 폭에서 문서 전체 가로 스크롤을 만들지 않는다.
- 표·지도·작업면은 자체 overflow 경계를 갖고, header와 본문이 서로의 높이를 밀어내지 않는다.

## 금지

- 새로운 초록 브랜드색, 임의 hex, 순수 검정, 큰 gradient 또는 유리 효과
- 카드 안에 장식용 카드·bordered box를 다시 넣는 중첩 containment
- 상태를 색상만으로 표현하거나 disabled/로딩을 opacity 하나로만 숨기는 방식
- 페이지마다 다른 버튼·입력·dialog·table recipe를 새로 만드는 방식

## 적용 위치

- 토큰: `frontend/tokens.css`, `frontend/src/app/globals.css`, `frontend/tailwind.config.ts`
- 셸: `frontend/src/components/AppShell.tsx`
- 공통 primitive: `frontend/src/components/ui/`
- 패널/KPI: `frontend/src/components/panels.tsx`, `frontend/src/components/SectionCard.tsx`,
  `frontend/src/components/StatStrip.tsx`
