import re

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .knowledge import load_knowledge
from .db_knowledge import load_db_knowledge
from .models import ChatRequest, ChatResponse, HealthResponse, SourceItem
from .retriever import detect_intent, retrieve_top_k
from .openrouter_client import chat_with_openrouter, check_openrouter
from .ui_payload import build_ui_payload, summarize_ui_payload


app = FastAPI(title="AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


docs_cache = []
docs_meta = {
    "file_docs": 0,
    "db_docs": 0,
    "db_error": None,
}


_STATUS_LABELS = {
    "pending": "Chờ xác nhận",
    "confirmed": "Đã xác nhận",
    "preparing": "Đang chuẩn bị",
    "shipping": "Đang giao",
    "completed": "Đã hoàn thành",
    "cancelled": "Đã hủy",
}


def _format_currency(value: float | int | None) -> str:
    amount = int(value or 0)
    return f"{amount:,} VND".replace(",", ".")


def _format_order_tracking_answer(ui_payload: dict | None) -> str | None:
    if not ui_payload:
        return None

    payload_type = ui_payload.get("type")
    if payload_type == "order_auth_required":
        return "Bạn vui lòng đăng nhập tài khoản khách hàng để mình kiểm tra trạng thái đơn hàng."

    if payload_type == "order_empty":
        return "Mình chưa tìm thấy đơn hàng gần đây của bạn. Bạn có thể mở trang đơn hàng để kiểm tra thêm."

    if payload_type != "order_detail":
        return None

    item = ui_payload.get("item") or {}
    status_key = str(item.get("status") or "").strip().lower()
    status_label = _STATUS_LABELS.get(status_key, status_key or "Không xác định")
    order_code = item.get("order_code") or ""
    address = ", ".join(
        part for part in [item.get("delivery_address"), item.get("delivery_ward_name")] if part
    )
    created_at = item.get("created_at") or item.get("updated_at")

    parts = [f"Đơn hàng {order_code} hiện ở trạng thái {status_label}."]
    if address:
        parts.append(f"Địa chỉ giao: {address}.")
    parts.append(f"Tổng tiền: {_format_currency(item.get('total_amount'))}.")
    if created_at:
        parts.append(f"Thời gian tạo đơn: {created_at}.")

    if status_key == "shipping":
        shipper_name = item.get("shipper_name")
        shipper_phone = item.get("shipper_phone")
        if shipper_name and shipper_phone:
            parts.append(f"Shipper đang giao là {shipper_name} - {shipper_phone}.")
        elif shipper_name:
            parts.append(f"Shipper đang giao là {shipper_name}.")

    return " ".join(parts)


def _select_context_docs(intent: str, docs: list[dict]) -> list[dict]:
    """
    Filter context docs by intent.
    TODO: Expand when adding new intents.
    """
    if not docs:
        return []
    if intent == "order_tracking":
        return []
    return docs[:3]


def _rebuild_docs_cache() -> None:
    global docs_cache
    global docs_meta

    file_docs = load_knowledge(
        settings.knowledge_dir,
        settings.rag_chunk_size,
        settings.rag_chunk_overlap,
        settings.rag_max_chunks,
    )

    db_docs = []
    db_error = None
    if settings.enable_db_knowledge:
        try:
            db_docs = load_db_knowledge(
                settings.db_host,
                settings.db_port,
                settings.db_user,
                settings.db_password,
                settings.db_name,
                settings.rag_chunk_size,
                settings.rag_chunk_overlap,
                settings.rag_max_chunks,
            )
        except Exception as exc:
            db_docs = []
            db_error = str(exc)

    docs_cache = (file_docs + db_docs)[: settings.rag_max_chunks]
    docs_meta = {
        "file_docs": len(file_docs),
        "db_docs": len(db_docs),
        "db_error": db_error,
    }


_rebuild_docs_cache()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    ok = check_openrouter(
        settings.openrouter_api_key,
        settings.openrouter_base_url,
        settings.openrouter_model,
        settings.openrouter_site_url,
        settings.openrouter_app_name,
    )
    return HealthResponse(ok=ok, model=settings.openrouter_model)


@app.post("/reindex")
def reindex() -> dict:
    _rebuild_docs_cache()
    return {
        "success": True,
        "total_docs": len(docs_cache),
        "db_enabled": settings.enable_db_knowledge,
        "meta": docs_meta,
    }


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    question = payload.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message is required")

    intent = detect_intent(question)
    top_docs = retrieve_top_k(question, docs_cache, settings.rag_top_k)
    context_docs = _select_context_docs(intent, top_docs)

    ui_payload = None
    try:
        ui_payload = build_ui_payload(
            intent=intent,
            question=question,
            user_id=payload.user_id,
            user_role=payload.user_role,
            host=settings.db_host,
            port=settings.db_port,
            user=settings.db_user,
            password=settings.db_password,
            db_name=settings.db_name,
        )
    except Exception:
        ui_payload = None

    context = "\n\n".join(
        [f"Source: {d['source']}\nContent: {d['text']}" for d in context_docs]
    )
    ui_summary = summarize_ui_payload(ui_payload)

    combined_parts = []
    if context:
        combined_parts.append(context)
    if ui_summary:
        combined_parts.append(f"Business data:\n{ui_summary}")
    combined_context = "\n\n".join(combined_parts)
    structured_answer = _format_order_tracking_answer(ui_payload) if intent == "order_tracking" else None

    system_prompt = (
        "Bạn là trợ lý CSKH cho CADAO. Trả lời bằng tiếng Việt, ngắn gọn, tự nhiên. "
        "Không được chép nguyên văn context, không liệt kê heading nội bộ như intent hay knowledge base. "
        "Nếu có business data thì ưu tiên diễn giải dữ liệu đó thành câu trả lời cho khách hàng."
    )

    user_prompt = (
        f"Câu hỏi: {question}\n\n"
        f"Context:\n{combined_context if combined_context else 'Không có context.'}\n\n"
        "Hãy trả lời dựa trên context nếu có."
    )

    fallback_answer = "Xin lỗi, hiện tại tôi chưa thể trả lời. Vui lòng thử lại sau."

    def build_context_fallback() -> str:
        def _normalize_context_text(text: str) -> str:
            cleaned = " ".join((text or "").split()).strip()
            # Remove markdown heading/list markers from chunked knowledge text.
            cleaned = re.sub(r"#+\s*", "", cleaned)
            cleaned = re.sub(r"\s-\s", " ", cleaned)
            cleaned = re.sub(r"^Knowledge Base\s*", "", cleaned, flags=re.IGNORECASE)
            return " ".join(cleaned.split()).strip()

        if structured_answer:
            return structured_answer

        if top_docs:
            raw = str(top_docs[0].get("text", "")).strip()
            if raw:
                return _normalize_context_text(raw)

        if ui_summary:
            return ui_summary

        return fallback_answer

    if structured_answer:
        answer = structured_answer
        fallback = False
    else:
        try:
            answer = chat_with_openrouter(
                settings.openrouter_api_key,
                settings.openrouter_base_url,
                settings.openrouter_model,
                system_prompt,
                user_prompt,
                settings.openrouter_timeout_seconds,
                settings.openrouter_site_url,
                settings.openrouter_app_name,
            )
            if not answer:
                answer = build_context_fallback()
                fallback = True
            else:
                fallback = False
        except Exception:
            answer = build_context_fallback()
            fallback = True

    unique_sources: dict = {}
    for doc in top_docs:
        source = doc["source"]
        score = doc["score"]
        if source not in unique_sources or score > unique_sources[source]:
            unique_sources[source] = score

    sources = [SourceItem(source=s, score=sc) for s, sc in unique_sources.items()]
    return ChatResponse(
        answer=answer,
        sources=sources,
        model=settings.openrouter_model,
        fallback=fallback,
        ui=ui_payload,
    )
