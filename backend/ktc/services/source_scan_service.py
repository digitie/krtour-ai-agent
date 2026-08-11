"""주기 source target scan 서비스.

`source_scan` 작업은 active `source_targets`를 확인해 due target을 후속
`harvest` 또는 `video_analysis` 작업으로 enqueue한다. Gemini 분석 자체는 이
서비스에서 실행하지 않고, 작업 생성과 target watermark/schedule 갱신만 담당한다.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ktc.models import CrawlRun, RunSource, RunState, SourceTarget, TargetType, utcnow
from ktc.services import crawl_run_service

ACTIVE_RUN_STATES = (RunState.PENDING, RunState.RUNNING)


class SourceTargetConflictError(ValueError):
    """반복 수집 대상을 다른 대상으로 바꿀 수 없을 때 사용한다."""


class SourceTargetActiveRunError(ValueError):
    """현재 대상에서 시작한 실행이 끝나기 전에는 검색어를 바꿀 수 없다."""


class SourceTargetDeletedError(ValueError):
    """삭제된 반복 수집 대상으로 실행을 요청했을 때 사용한다."""


def _as_utc(value: datetime | None) -> datetime:
    if value is None:
        return utcnow()
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _next_crawl_at(
    target: SourceTarget,
    *,
    now: datetime,
    default_interval_minutes: int,
) -> datetime:
    raw_interval = target.scan_interval_minutes or default_interval_minutes
    interval = max(1, int(raw_interval))
    return _as_utc(now) + timedelta(minutes=interval)


def _duplicate_backoff_at(now: datetime, *, duplicate_backoff_minutes: int) -> datetime:
    return _as_utc(now) + timedelta(minutes=max(1, duplicate_backoff_minutes))


def build_followup_run(
    target: SourceTarget,
    *,
    max_videos: int,
) -> tuple[str, str, str, dict[str, Any]]:
    """source target을 follow-up crawl_run 입력으로 변환한다."""
    # 대상에 저장된 수집 개수(max_videos)가 있으면 우선 사용한다(없으면 호출부 기본값).
    effective_max = target.max_videos if target.max_videos is not None else max_videos
    payload: dict[str, Any] = {
        "source_target_id": target.id,
        "source_value": target.source_value,
        "api_budget_group": target.api_budget_group,
    }
    if target.default_category_code:
        payload["default_category_code"] = target.default_category_code
    if target.target_type == TargetType.KEYWORD:
        payload.update({"query": target.source_value, "max_videos": effective_max})
        return "harvest", "keyword", target.source_value, payload
    if target.target_type == TargetType.CHANNEL:
        payload.update({"channel_id": target.source_value, "max_videos": effective_max})
        return "harvest", "channel", target.source_value, payload
    if target.target_type == TargetType.PLAYLIST:
        payload.update({"playlist_id": target.source_value, "max_videos": effective_max})
        return "harvest", "playlist", target.source_value, payload
    if target.target_type == TargetType.VIDEO:
        payload.update(
            {
                "video_id": target.source_value,
                "analysis_run_types": ["url_summary", "reconcile"],
            }
        )
        return "video_analysis", "video", target.source_value, payload
    raise ValueError(f"지원하지 않는 source target_type: {target.target_type}")


async def has_active_run(
    session: AsyncSession,
    *,
    job_type: str,
    target_type: str | None,
    target_id: str | None,
) -> bool:
    """같은 target의 pending/running 작업이 이미 있는지 확인한다."""
    stmt = (
        select(CrawlRun.id)
        .where(
            CrawlRun.job_type == job_type,
            CrawlRun.target_type == target_type,
            CrawlRun.target_id == target_id,
            CrawlRun.state.in_(ACTIVE_RUN_STATES),
        )
        .limit(1)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none() is not None


async def list_due_targets(
    session: AsyncSession,
    *,
    now: datetime,
    limit: int,
    api_budget_group: str | None = None,
) -> list[SourceTarget]:
    """due active source target 목록을 반환한다."""
    stmt = (
        select(SourceTarget)
        .where(
            SourceTarget.is_active.is_(True),
            or_(
                SourceTarget.next_crawl_at.is_(None),
                SourceTarget.next_crawl_at <= now,
            ),
        )
        .order_by(SourceTarget.next_crawl_at.asc().nullsfirst(), SourceTarget.id.asc())
        .limit(max(1, limit))
    )
    if api_budget_group:
        stmt = stmt.where(
            or_(
                SourceTarget.api_budget_group == api_budget_group,
                SourceTarget.api_budget_group.is_(None),
            )
        )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def scan_due_targets(
    session: AsyncSession,
    *,
    now: datetime | None = None,
    limit: int = 20,
    default_interval_minutes: int = 10_080,
    duplicate_backoff_minutes: int = 15,
    max_videos: int = 20,
    api_budget_group: str | None = None,
) -> dict[str, Any]:
    """due target을 후속 작업으로 enqueue하고 scan schedule을 갱신한다."""
    scan_now = _as_utc(now)
    due_targets = await list_due_targets(
        session,
        now=scan_now,
        limit=limit,
        api_budget_group=api_budget_group,
    )

    enqueued_run_ids: list[int] = []
    skipped_existing = 0
    failed = 0
    target_summaries: list[dict[str, Any]] = []

    for listed_target in due_targets:
        # 검색어 수정/삭제와 같은 사용자 mutation과 같은 행을 잠가, 목록을 읽은 뒤
        # 과거 source_value로 follow-up run을 발급하는 경쟁을 막는다.
        target = (
            await session.execute(
                select(SourceTarget)
                .where(
                    SourceTarget.id == listed_target.id,
                    SourceTarget.is_active.is_(True),
                )
                .with_for_update()
                .execution_options(populate_existing=True)
            )
        ).scalar_one_or_none()
        if target is None:
            continue
        target.last_scan_at = scan_now
        try:
            job_type, target_type, target_id, payload = build_followup_run(
                target,
                max_videos=max_videos,
            )
            if await has_active_run(
                session,
                job_type=job_type,
                target_type=target_type,
                target_id=target_id,
            ):
                skipped_existing += 1
                target.next_crawl_at = _duplicate_backoff_at(
                    scan_now,
                    duplicate_backoff_minutes=duplicate_backoff_minutes,
                )
                target_summaries.append(
                    {
                        "source_target_id": target.id,
                        "target_type": target.target_type,
                        "source_value": target.source_value,
                        "status": "skipped_existing_run",
                    }
                )
                continue

            # 스케줄러 스캔 발원 harvest/video_analysis — 배치 레인(기본, T-163).
            run = await crawl_run_service.create_run(
                session,
                job_type=job_type,
                source=RunSource.SCHEDULER,
                target_type=target_type,
                target_id=target_id,
                payload=payload,
                commit=False,
            )
            enqueued_run_ids.append(run.id)
            target.run_count = (target.run_count or 0) + 1
            target.scan_failure_count = 0
            target.last_scan_error = None
            target.next_crawl_at = _next_crawl_at(
                target,
                now=scan_now,
                default_interval_minutes=default_interval_minutes,
            )
            # 반복 상한 도달 시 더 이상 스캔하지 않도록 비활성화한다(0이면 무한).
            if target.max_runs and target.run_count >= target.max_runs:
                target.is_active = False
                target.next_crawl_at = None
            target_summaries.append(
                {
                    "source_target_id": target.id,
                    "target_type": target.target_type,
                    "source_value": target.source_value,
                    "status": "enqueued",
                    "job_type": job_type,
                    "run_id": run.id,
                }
            )
        except Exception as exc:
            failed += 1
            target.scan_failure_count = (target.scan_failure_count or 0) + 1
            target.last_scan_error = str(exc)
            target.next_crawl_at = _duplicate_backoff_at(
                scan_now,
                duplicate_backoff_minutes=duplicate_backoff_minutes,
            )
            target_summaries.append(
                {
                    "source_target_id": target.id,
                    "target_type": target.target_type,
                    "source_value": target.source_value,
                    "status": "failed",
                    "error": str(exc),
                }
            )

    await session.commit()
    return {
        "scanned_targets": len(due_targets),
        "enqueued_runs": len(enqueued_run_ids),
        "skipped_existing_runs": skipped_existing,
        "failed_targets": failed,
        "run_ids": enqueued_run_ids,
        "targets": target_summaries,
    }


async def upsert_recurring_target(
    session: AsyncSession,
    *,
    target_type: str,
    source_value: str,
    display_name: str | None = None,
    scan_interval_minutes: int,
    max_runs: int = 0,
    max_videos: int | None = None,
    default_category_code: str | None = None,
    now: datetime | None = None,
    commit: bool = True,
) -> SourceTarget:
    """반복 수집 대상을 등록/갱신한다.

    즉시 1회 수집은 별도 one-shot harvest가 처리하므로, 주기 스캔은 interval 이후에
    시작하도록 `next_crawl_at`을 `now + interval`로 둔다. 재등록 시 `run_count`는 0으로
    리셋해 새 반복 한도(`max_runs`)를 처음부터 적용한다(`max_runs`=0이면 무한).
    """
    scan_now = _as_utc(now)
    interval = max(1, int(scan_interval_minutes))
    stmt = select(SourceTarget).where(
        SourceTarget.target_type == target_type,
        SourceTarget.source_value == source_value,
    ).with_for_update()
    result = await session.execute(stmt)
    target = result.scalar_one_or_none()
    if target is None:
        target = SourceTarget(target_type=target_type, source_value=source_value)
        session.add(target)
    target.is_active = True
    target.scan_interval_minutes = interval
    target.max_runs = max(0, int(max_runs))
    if max_videos is not None:
        target.max_videos = max(1, int(max_videos))
    from ktc.etl import category_catalog

    target.default_category_code = category_catalog.normalize_code(default_category_code)
    target.run_count = 0
    if display_name:
        target.display_name = display_name
    elif not target.display_name:
        target.display_name = source_value
    target.next_crawl_at = scan_now + timedelta(minutes=interval)
    target.scan_failure_count = 0
    target.last_scan_error = None
    if commit:
        await session.commit()
        await session.refresh(target)
    else:
        # 최초 harvest의 payload에 source_target_id를 남길 수 있도록 새 행의 ID를
        # 같은 transaction 안에서 확보한다.
        await session.flush()
    return target


async def list_recurring_targets(session: AsyncSession) -> list[SourceTarget]:
    """반복 수집(스캔 주기 설정)이 활성화된 대상 목록을 최신순으로 반환한다."""
    stmt = (
        select(SourceTarget)
        .where(
            SourceTarget.is_active.is_(True),
            SourceTarget.scan_interval_minutes.is_not(None),
        )
        .order_by(SourceTarget.id.desc())
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def update_recurring_target(
    session: AsyncSession,
    target_id: int,
    *,
    query: str | None = None,
    scan_interval_minutes: int | None = None,
    max_runs: int | None = None,
    is_active: bool | None = None,
    max_videos: int | None = None,
    default_category_code: str | None = None,
    now: datetime | None = None,
    commit: bool = True,
) -> SourceTarget | None:
    """반복 수집 대상의 검색어·주기·횟수·활성 여부·수집개수를 수정한다.

    검색어 변경은 이전 검색의 watermark/실행 횟수를 재사용하면 증분 수집을 잘못
    건너뛸 수 있으므로 새 검색의 첫 실행처럼 초기화한다. 이미 발급된 crawl run의
    입력은 불변이어야 하므로, 이 대상에서 시작한 실행이 남아 있으면 변경을 막는다.
    """
    target = (
        await session.execute(
            select(SourceTarget)
            .where(SourceTarget.id == target_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
    ).scalar_one_or_none()
    if target is None:
        return None
    scan_now = _as_utc(now)

    normalized_query = query.strip() if query is not None else None
    query_changed = (
        normalized_query is not None and normalized_query != target.source_value
    )
    if query_changed:
        if target.target_type != TargetType.KEYWORD:
            raise SourceTargetConflictError("검색어 수집 작업만 검색어를 수정할 수 있습니다")

        duplicate = (
            await session.execute(
                select(SourceTarget.id).where(
                    SourceTarget.target_type == TargetType.KEYWORD,
                    SourceTarget.source_value == normalized_query,
                    SourceTarget.id != target.id,
                )
            )
        ).scalar_one_or_none()
        if duplicate is not None:
            raise SourceTargetConflictError("같은 검색어의 수집 작업이 이미 있습니다")

        active_runs = (
            await session.execute(
                select(CrawlRun).where(
                    CrawlRun.target_type == TargetType.KEYWORD,
                    CrawlRun.target_id == target.source_value,
                    CrawlRun.state.in_(ACTIVE_RUN_STATES),
                )
            )
        ).scalars()
        for run in active_runs:
            try:
                run_payload = json.loads(run.payload_json or "{}")
            except json.JSONDecodeError:
                run_payload = None
            # 배포 전 생성된 최초 반복 harvest에는 source_target_id가 없었다. 반복
            # 설정값으로만 구분해, 같은 검색어의 무관한 one-shot은 수정 차단에서 제외한다.
            is_target_run = isinstance(run_payload, dict) and (
                run_payload.get("source_target_id") == target.id
                or (
                    run_payload.get("source_target_id") is None
                    and run_payload.get("repeat_interval_minutes")
                )
            )
            if is_target_run:
                raise SourceTargetActiveRunError(
                    "진행 중인 수집이 끝나거나 중지된 뒤 검색어를 수정할 수 있습니다"
                )

        target.source_value = normalized_query
        # 검색어 수집 대상에는 별도 표시명 편집 기능이 없으므로 새 검색어를 함께 표시한다.
        target.display_name = normalized_query
        target.last_crawled_at = None
        target.last_seen_cursor = None
        target.last_seen_video_published_at = None
        target.last_scan_at = None
        target.scan_failure_count = 0
        target.last_scan_error = None
        target.run_count = 0
    if scan_interval_minutes is not None:
        interval = max(1, int(scan_interval_minutes))
        target.scan_interval_minutes = interval
        target.next_crawl_at = scan_now + timedelta(minutes=interval)
    elif query_changed and target.scan_interval_minutes:
        target.next_crawl_at = scan_now + timedelta(
            minutes=max(1, int(target.scan_interval_minutes))
        )
    if max_runs is not None:
        target.max_runs = max(0, int(max_runs))
    if max_videos is not None:
        target.max_videos = max(1, int(max_videos))
    if default_category_code is not None:
        from ktc.etl import category_catalog

        target.default_category_code = category_catalog.normalize_code(
            default_category_code
        )
    if is_active is not None:
        target.is_active = bool(is_active)
        if (
            is_active
            and target.next_crawl_at is None
            and target.scan_interval_minutes
        ):
            target.next_crawl_at = scan_now + timedelta(
                minutes=max(1, int(target.scan_interval_minutes))
            )
    try:
        if commit:
            await session.commit()
        else:
            await session.flush()
    except IntegrityError as exc:
        await session.rollback()
        if query_changed:
            raise SourceTargetConflictError("같은 검색어의 수집 작업이 이미 있습니다") from exc
        raise
    if commit:
        await session.refresh(target)
    return target


async def deactivate_target(
    session: AsyncSession, target_id: int, *, commit: bool = True
) -> SourceTarget | None:
    """반복 수집 대상을 비활성화한다(watermark `last_crawled_at`은 보존)."""
    target = (
        await session.execute(
            select(SourceTarget)
            .where(SourceTarget.id == target_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
    ).scalar_one_or_none()
    if target is None:
        return None
    target.is_active = False
    target.scan_interval_minutes = None
    target.next_crawl_at = None
    if commit:
        await session.commit()
    else:
        await session.flush()
    return target


async def run_target_now(
    session: AsyncSession,
    target_id: int,
    *,
    now: datetime | None = None,
    max_videos: int = 20,
    force: bool = False,
    commit: bool = True,
) -> tuple[SourceTarget | None, CrawlRun | None, bool]:
    """반복 대상을 즉시 1회 enqueue한다('지금 진행' / '강제 재실행').

    스캔 due 여부와 무관하게 사용자가 수동으로 트리거한다. 같은 작업이 이미
    pending/running이면 새로 만들지 않고 그 작업을 반환한다(중복 방지). 새로
    만든 경우 `run_count`를 올리고 다음 스캔 시각을 now+interval로 미룬다.
    `max_runs` 도달 시에도 이번 수동 실행은 허용하되 이후 자동 스캔은 멈춘다.
    `force=True`(강제 재실행)면 증분 워터마크를 리셋해 대상 영상을 다시 수집하고,
    후처리가 대상의 미완료 영상을 재처리하도록 payload에 force 플래그를 넣는다.
    반환값: (target, run, created).
    """
    target = (
        await session.execute(
            select(SourceTarget)
            .where(SourceTarget.id == target_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
    ).scalar_one_or_none()
    if target is None:
        return None, None, False
    # 삭제는 is_active만으로 구분하지 않는다. max_runs 도달 후 비활성화된 대상은
    # 기존 계약대로 수동 실행할 수 있지만, 삭제된 대상은 scan 간격을 제거한다.
    if target.scan_interval_minutes is None:
        raise SourceTargetDeletedError("삭제된 반복 수집 작업은 실행할 수 없습니다")

    scan_now = _as_utc(now)
    target.last_scan_at = scan_now
    job_type, target_type, run_target_id, payload = build_followup_run(
        target, max_videos=max_videos
    )
    if force:
        payload["force"] = True
        target.last_seen_cursor = None
        target.last_seen_video_published_at = None

    if await has_active_run(
        session,
        job_type=job_type,
        target_type=target_type,
        target_id=run_target_id,
    ):
        existing = (
            await session.execute(
                select(CrawlRun)
                .where(
                    CrawlRun.job_type == job_type,
                    CrawlRun.target_type == target_type,
                    CrawlRun.target_id == run_target_id,
                    CrawlRun.state.in_(ACTIVE_RUN_STATES),
                )
                .order_by(CrawlRun.id.desc())
                .limit(1)
            )
        ).scalars().first()
        if commit:
            await session.commit()
        else:
            await session.flush()
        return target, existing, False

    # '지금 진행'/강제 재실행(run-now)은 사용자 트리거지만 수집 성격이라 배치 레인
    # (기본, T-163) — 대화형 레인을 수집으로 점유시키지 않는다.
    run = await crawl_run_service.create_run(
        session,
        job_type=job_type,
        source=RunSource.WEB,
        target_type=target_type,
        target_id=run_target_id,
        payload=payload,
        commit=False,
    )
    target.run_count = (target.run_count or 0) + 1
    target.scan_failure_count = 0
    target.last_scan_error = None
    if target.scan_interval_minutes:
        target.next_crawl_at = scan_now + timedelta(
            minutes=max(1, int(target.scan_interval_minutes))
        )
    # 반복 상한 도달 시 이번 수동 실행은 허용하되 이후 자동 스캔은 멈춘다.
    if target.max_runs and target.run_count >= target.max_runs:
        target.is_active = False
        target.next_crawl_at = None
    if commit:
        await session.commit()
        await session.refresh(run)
    else:
        await session.flush()
    return target, run, True


async def ensure_source_scan_run(
    session: AsyncSession,
    *,
    payload: dict[str, Any] | None = None,
) -> tuple[CrawlRun | None, bool]:
    """active source_scan 작업이 없으면 새 source_scan crawl_run을 만든다."""
    if await has_active_run(
        session,
        job_type="source_scan",
        target_type="source_targets",
        target_id="active",
    ):
        return None, False
    # 주기 스캔 enqueue 작업 자체 — 배치 레인(기본, T-163).
    run = await crawl_run_service.create_run(
        session,
        job_type="source_scan",
        source=RunSource.SCHEDULER,
        target_type="source_targets",
        target_id="active",
        payload=payload or {},
        commit=True,
    )
    return run, True
