"""Prometheus용 저카디널리티 운영 지표."""

from __future__ import annotations

import re
from collections import defaultdict
from typing import Any

from prometheus_client import (
    GC_COLLECTOR,
    PLATFORM_COLLECTOR,
    PROCESS_COLLECTOR,
    REGISTRY,
    Counter,
    Gauge,
    Histogram,
    ProcessCollector,
)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ktc.models import CrawlRun, RunState

# prometheus_client의 기본 수집기(process/platform/gc)는 접두어가 없어 kor-travel
# 계열의 서비스별 네임스페이스 규약(concierge=ktc_, docker-manager=ktdm_)을 벗어난다.
# 기본 수집기를 해제하고, 값이 있는 process 지표만 ktc_ namespace로 다시 등록한다
# (플랫폼 정보·GC 통계는 운영상 가치가 낮아 다시 등록하지 않는다).
for _default_collector in (PROCESS_COLLECTOR, PLATFORM_COLLECTOR, GC_COLLECTOR):
    try:
        REGISTRY.unregister(_default_collector)
    except KeyError:
        pass
ProcessCollector(namespace="ktc")

HTTP_REQUESTS = Counter(
    "ktc_http_requests",
    "HTTP 요청 수",
    ("method", "path", "status"),
)
HTTP_REQUEST_DURATION = Histogram(
    "ktc_http_request_duration_seconds",
    "HTTP 요청 처리 시간(초)",
    ("method", "path"),
)
RUN_ACTIONS = Counter(
    "ktc_run_actions",
    "작업 제어 동작 수",
    ("action", "result"),
)
RUNS_BY_STATE = Gauge(
    "ktc_crawl_runs",
    "현재 작업 수",
    ("job_type", "state"),
)
RUN_ERRORS_BY_KIND = Gauge(
    "ktc_crawl_run_errors",
    "실패 상태 작업의 원인 분류별 수",
    ("job_type", "kind"),
)
RUN_METRICS_REFRESH_SUCCESS = Gauge(
    "ktc_crawl_run_metrics_refresh_success",
    "작업 DB 지표의 마지막 갱신 성공 여부(1=성공, 0=실패)",
)

_LABEL_RE = re.compile(r"[^A-Za-z0-9_.:/{}-]+")


def label_value(value: Any, *, max_length: int = 120) -> str:
    """사용자 입력이 지표 label이 되지 않도록 안전하고 짧게 정규화한다."""
    normalized = _LABEL_RE.sub("_", str(value).strip())
    return normalized[:max_length] or "unknown"


def request_path(request: Any) -> str:
    """FastAPI route template을 쓰고, 매칭되지 않은 요청은 한 시계열로 묶는다."""
    route = request.scope.get("route")
    route_path = getattr(route, "path", None)
    if route_path:
        return label_value(route_path)
    # route가 없는 404·OPTIONS 요청에 원시 path를 넣으면 nonce/임의 ID마다
    # Prometheus 시계열이 생긴다. 유효한 route는 FastAPI가 template을 채우므로
    # 미매칭 요청은 의도적으로 고정 label만 사용한다.
    return "/unmatched"


def record_http_request(
    *, method: str, path: str, status_code: int, duration_seconds: float
) -> None:
    """HTTP 지표를 기록한다. 원시 URL, query, job ID는 label로 저장하지 않는다."""
    normalized_method = label_value(method.upper(), max_length=16)
    normalized_path = label_value(path)
    HTTP_REQUESTS.labels(
        normalized_method, normalized_path, str(int(status_code))
    ).inc()
    HTTP_REQUEST_DURATION.labels(normalized_method, normalized_path).observe(
        max(0.0, duration_seconds)
    )


def record_run_action(*, action: str, result: str) -> None:
    """작업 제어 동작을 저카디널리티 label로 기록한다."""
    RUN_ACTIONS.labels(
        label_value(action, max_length=32), label_value(result, max_length=32)
    ).inc()


def classify_error(error: str | None) -> str:
    """사용자에게 노출되는 오류 문자열을 운영용 원인 종류로 분류한다."""
    value = (error or "").lower()
    if any(
        token in value for token in ("timeout", "timed out", "네트워크", "connection")
    ):
        return "network"
    if "youtube api" in value or (
        "youtube" in value
        and ("호출" in value or "quota" in value or "쿼터" in value)
    ):
        if "quota" in value or "쿼터" in value:
            return "youtube_quota"
        return "youtube_api"
    if any(token in value for token in ("validation", "검증", "입력")):
        return "validation"
    return "unknown"


async def refresh_run_metrics(session: AsyncSession) -> None:
    """현재 DB 작업 상태와 실패 원인 집계를 gauge에 반영한다."""
    state_rows = (
        await session.execute(
            select(CrawlRun.job_type, CrawlRun.state, func.count()).group_by(
                CrawlRun.job_type, CrawlRun.state
            )
        )
    ).all()
    failed_rows = (
        await session.execute(
            select(CrawlRun.job_type, CrawlRun.last_error).where(
                CrawlRun.state == RunState.FAILED
            )
        )
    ).all()

    state_counts: dict[tuple[str, str], int] = defaultdict(int)
    for job_type, state, count in state_rows:
        state_counts[(label_value(job_type), label_value(state))] += int(count)

    error_counts: dict[tuple[str, str], int] = defaultdict(int)
    for job_type, last_error in failed_rows:
        error_counts[(label_value(job_type), classify_error(last_error))] += 1

    RUNS_BY_STATE.clear()
    for (job_type, state), count in state_counts.items():
        RUNS_BY_STATE.labels(job_type, state).set(count)

    RUN_ERRORS_BY_KIND.clear()
    for (job_type, kind), count in error_counts.items():
        RUN_ERRORS_BY_KIND.labels(job_type, kind).set(count)
    RUN_METRICS_REFRESH_SUCCESS.set(1)


def mark_run_metrics_refresh_failed() -> None:
    """DB 집계가 실패했음을 stale gauge와 구분할 상태 지표에 남긴다."""
    RUN_METRICS_REFRESH_SUCCESS.set(0)
