"""Prometheus 지표 label과 오류 분류 단위 테스트."""

from ktc.telemetry import classify_error, label_value


def test_classify_error_uses_stable_low_cardinality_kinds():
    assert classify_error(
        "YouTube API search 호출 실패(status=403; reason=quotaExceeded)"
    ) == "youtube_quota"
    assert classify_error("YouTube API videos 네트워크 오류") == "youtube_api"
    assert classify_error("입력 검증 실패") == "validation"
    assert classify_error("알 수 없는 워커 예외") == "unknown"


def test_label_value_limits_cardinality_and_length():
    assert label_value("seoul jeju") == "seoul_jeju"
    assert label_value("x" * 200, max_length=16) == "x" * 16
    assert label_value("   ") == "unknown"
