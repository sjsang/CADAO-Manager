import re
from typing import Dict, List, Optional


def _order_code_from_question(question: str) -> Optional[str]:
    match = re.search(r"(ORD\d{8}-\d+)", question or "", re.IGNORECASE)
    return match.group(1).upper() if match else None


def _build_dsn(host: str, port: int, user: str, password: str, db_name: str) -> str:
    return (
        f"host={host} port={port} user={user} password={password} dbname={db_name} "
        "connect_timeout=3"
    )


_STOPWORDS = {
    "toi",
    "muon",
    "an",
    "tim",
    "mon",
    "gi",
    "nao",
    "cho",
    "minh",
    "toi",
    "can",
    "voi",
    "duoc",
    "khong",
    "thoi",
    "nhe",
    "tôi",
    "muốn",
    "ăn",
    "tìm",
    "món",
    "gì",
    "nào",
    "cho",
    "mình",
    "cần",
    "với",
    "được",
    "không",
    "thôi",
    "nhé",
}


def _extract_keywords(question: str) -> List[str]:
    normalized = (question or "").lower()
    tokens = re.findall(r"\w+", normalized, flags=re.UNICODE)
    dedup: List[str] = []
    seen = set()
    for token in tokens:
        t = token.strip().lower()
        if len(t) < 2 or t in _STOPWORDS:
            continue
        if t in seen:
            continue
        seen.add(t)
        dedup.append(t)
    return dedup[:6]


def _load_menu_by_keywords(
    host: str,
    port: int,
    user: str,
    password: str,
    db_name: str,
    keywords: List[str],
    limit: int = 6,
) -> List[Dict]:
    if not keywords:
        return []

    import psycopg

    clauses = []
    params: List[str] = []
    for kw in keywords:
        clauses.append("(mi.name ILIKE %s OR COALESCE(mi.description, '') ILIKE %s)")
        like = f"%{kw}%"
        params.extend([like, like])

    where_sql = " OR ".join(clauses)
    dsn = _build_dsn(host, port, user, password, db_name)
    query = f"""
        SELECT mi.id, mi.name, mi.description, mi.price, mi.image_url, mi.is_available
        FROM menu_items mi
        WHERE ({where_sql})
        ORDER BY mi.is_available DESC, mi.name ASC
        LIMIT %s
    """

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(query, [*params, limit])
            rows = cur.fetchall()

    return [
        {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "price": float(row[3] or 0),
            "image_url": row[4],
            "is_available": bool(row[5]),
            "cta": {"type": "add_to_cart", "label": "Thêm vào giỏ"},
        }
        for row in rows
    ]


def _load_customer_latest_order(
    host: str,
    port: int,
    user: str,
    password: str,
    db_name: str,
    customer_id: int,
    question: str,
) -> Optional[Dict]:
    import psycopg

    order_code = _order_code_from_question(question)
    dsn = _build_dsn(host, port, user, password, db_name)

    query = """
        SELECT
            o.order_code,
            o.status,
            o.total_amount,
            o.delivery_address,
            o.delivery_ward_name,
            o.created_at,
            o.updated_at,
            u.full_name AS shipper_name,
            u.phone_number AS shipper_phone
        FROM orders o
        LEFT JOIN users u ON u.id = o.shipper_id
        WHERE o.customer_id = %s AND o.status <> 'cart'
    """
    params: List = [customer_id]

    if order_code:
        query += " AND o.order_code = %s ORDER BY o.updated_at DESC LIMIT 1"
        params.append(order_code)
    else:
        query += " ORDER BY o.updated_at DESC, o.created_at DESC LIMIT 1"

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            row = cur.fetchone()

    if not row:
        return None

    return {
        "order_code": row[0],
        "status": row[1],
        "total_amount": float(row[2] or 0),
        "delivery_address": row[3],
        "delivery_ward_name": row[4],
        "created_at": row[5].isoformat() if row[5] else None,
        "updated_at": row[6].isoformat() if row[6] else None,
        "shipper_name": row[7],
        "shipper_phone": row[8],
        "cta": {"type": "open_order", "label": "Xem chi tiết đơn"},
    }


def build_ui_payload(
    intent: str,
    question: str,
    user_id: Optional[int],
    user_role: Optional[str],
    host: str,
    port: int,
    user: str,
    password: str,
    db_name: str,
) -> Optional[Dict]:
    if intent == "dish_search":
        keywords = _extract_keywords(question)
        items = _load_menu_by_keywords(host, port, user, password, db_name, keywords)
        if not items:
            return None
        return {
            "type": "menu_cards",
            "title": "Món phù hợp với nhu cầu của bạn",
            "items": items,
        }

    if intent == "order_tracking":
        if user_role != "customer" or not user_id:
            return {
                "type": "order_auth_required",
                "title": "Theo dõi đơn hàng",
                "message": "Bạn cần đăng nhập tài khoản khách hàng để xem trạng thái đơn hàng.",
                "cta": {"type": "open_login", "label": "Đăng nhập ngay"},
            }

        item = _load_customer_latest_order(
            host,
            port,
            user,
            password,
            db_name,
            user_id,
            question,
        )
        if not item:
            return {
                "type": "order_empty",
                "title": "Theo dõi đơn hàng",
                "message": "Mình chưa tìm thấy đơn hàng gần đây của bạn.",
                "cta": {"type": "open_orders", "label": "Mở trang đơn hàng"},
            }
        return {
            "type": "order_detail",
            "title": "Trạng thái đơn hàng của bạn",
            "item": item,
        }

    return None


def summarize_ui_payload(ui_payload: Optional[Dict]) -> str:
    if not ui_payload:
        return ""

    payload_type = ui_payload.get("type")

    if payload_type == "menu_cards":
        items = ui_payload.get("items", [])[:3]
        return "\n".join(
            f"Gợi ý món: {item.get('name')} - giá {int(item.get('price', 0)):,} VND".replace(",", ".")
            for item in items
        )

    if payload_type == "order_detail":
        item = ui_payload.get("item") or {}
        return (
            f"Đơn {item.get('order_code')} - trạng thái {item.get('status')} - "
            f"địa chỉ {item.get('delivery_address')}, {item.get('delivery_ward_name')} - "
            f"tổng {int(item.get('total_amount', 0)):,} VND"
        ).replace(",", ".")

    if payload_type == "order_empty":
        return str(ui_payload.get("message") or "")

    if payload_type == "order_auth_required":
        return str(ui_payload.get("message") or "")

    return ""
