import re
import unicodedata
from typing import Dict, List


_token_pattern = re.compile(r"\w+")


def _normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text or "")
    without_marks = "".join(char for char in normalized if not unicodedata.combining(char))
    return without_marks.replace("đ", "d").replace("Đ", "d").lower()


def _tokens(text: str) -> set:
    return {t for t in _token_pattern.findall(_normalize_text(text)) if t}


def _contains_any_keyword(text: str, keywords: List[str]) -> bool:
    normalized = _normalize_text(text)
    return any(_normalize_text(keyword) in normalized for keyword in keywords)


def detect_intent(question: str) -> str:
    """Phân loại ý định câu hỏi cho trợ lý khách hàng."""
    normalized = _normalize_text(question)

    # === ORDER_TRACKING ===
    # Nhận diện mã đơn hàng ORD + 8 chữ số + "-" + số
    if re.search(r"ord\d{8}-\d+", normalized):
        return "order_tracking"

    # Nhận diện keywords liên quan đến tracking
    if _contains_any_keyword(
        normalized,
        [
            "theo dõi đơn",
            "theo dõi đơn hàng",
            "trạng thái đơn",
            "trạng thái đơn hàng",
            "đơn hàng của tôi",
            "đơn của tôi",
            "kiểm tra đơn",
            "xem trạng thái",
            "mã đơn",
            "mã đơn hàng",
        ],
    ):
        return "order_tracking"

    # TODO: Thêm các intent khác ở đây

    return "general"


def _intent_adjustment(intent: str, kind: str) -> float:
    """
    Điều chỉnh score RAG theo intent.
    TODO: Thêm boost/penalty theo từng cặp (intent, kind) khi cần.
    """
    return 0.0


def retrieve_top_k(question: str, docs: List[Dict], k: int) -> List[Dict]:
    q = _tokens(question)
    if not q:
        return []

    intent = detect_intent(question)

    scored = []
    for doc in docs:
        d = _tokens(doc["text"])
        if not d:
            continue
        overlap = q.intersection(d)
        if not overlap:
            continue
        base_score = len(overlap) / max(len(q), 1)
        score = base_score + _intent_adjustment(intent, str(doc.get("kind", "general")))
        if score <= 0:
            continue
        scored.append({**doc, "score": round(score, 4)})

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:k]
