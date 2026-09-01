"""Prometheus 지표 label과 오류 분류 단위 테스트."""

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from ktc.core.config import Settings
from ktc.core.security import require_prometheus_access
from ktc.telemetry import classify_error, label_value, request_path


def _request(
    path: str,
    *,
    route_path: str | None = None,
    headers: tuple[tuple[str, str], ...] = (),
    client: tuple[str, int] = ("127.0.0.1", 1234),
) -> Request:
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": [
            (name.lower().encode(), value.encode()) for name, value in headers
        ],
        "client": client,
        "server": ("testserver", 80),
    }
    if route_path is not None:
        scope["route"] = type("Route", (), {"path": route_path})()
    return Request(scope)


def test_classify_error_uses_stable_low_cardinality_kinds():
    assert classify_error(
        "YouTube API search 호출 실패(status=403; reason=quotaExceeded)"
    ) == "youtube_quota"
    assert classify_error("YouTube API videos 네트워크 오류") == "network"
    assert classify_error("입력 검증 실패") == "validation"
    assert classify_error("알 수 없는 워커 예외") == "unknown"


def test_label_value_limits_cardinality_and_length():
    assert label_value("seoul jeju") == "seoul_jeju"
    assert label_value("x" * 200, max_length=16) == "x" * 16
    assert label_value("   ") == "unknown"


def test_request_path_uses_route_template_and_groups_unmatched_requests():
    request = _request(
        "/api/v1/videos/video-A-123/transcript",
        route_path="/api/v1/videos/{video_id}/transcript",
    )
    other_request = _request(
        "/api/v1/themes/video/video-B-456/places",
        route_path="/api/v1/themes/video/{video_id}/places",
    )
    unmatched_request = _request("/api/v1/no-route/nonce-123")

    assert request_path(request) == "/api/v1/videos/{video_id}/transcript"
    assert request_path(other_request) == "/api/v1/themes/video/{video_id}/places"
    assert request_path(unmatched_request) == "/unmatched"


@pytest.mark.asyncio
async def test_prometheus_access_rejects_forwarded_peer_without_dedicated_key():
    request = _request(
        "/metrics",
        headers=(("x-forwarded-for", "127.0.0.1"),),
    )
    settings = Settings(APP_ENV="production")

    with pytest.raises(HTTPException) as raised:
        await require_prometheus_access(request, settings)

    assert getattr(raised.value, "status_code", None) == 403
