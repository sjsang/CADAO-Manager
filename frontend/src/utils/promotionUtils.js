/**
 * Tính giá trị giảm thực tế của một promotion cho 1 đơn vị sản phẩm.
 * @param {object} promo
 * @param {number} unitPrice - Giá 1 đơn vị (chưa nhân số lượng)
 */
export const calcPromoDiscount = (promo, unitPrice) => {
    if (!promo) return 0;
    if (promo.discount_percent) return unitPrice * Number(promo.discount_percent) / 100;
    return Math.min(Number(promo.discount_amount ?? 0), unitPrice);
};

/**
 * Chọn promotion có lợi nhất (giảm nhiều nhất) cho 1 item dựa trên giá đơn vị.
 * @param {object[]} promos - Danh sách promotion áp dụng được cho item này
 * @param {number} unitPrice
 * @returns {object|null}
 */
export const pickBestPromo = (promos, unitPrice) => {
    if (!promos || promos.length === 0) return null;
    return promos.reduce((best, promo) =>
        calcPromoDiscount(promo, unitPrice) > calcPromoDiscount(best, unitPrice) ? promo : best
    );
};

/**
 * Xây dựng map: menu_item_id -> promotion tốt nhất.
 * @param {object[]} promoRows - Mảng rows từ API (nhiều dòng/item)
 * @param {Object.<number|string, number>} itemPriceMap - { menu_item_id: unitPrice }
 * @returns {Object.<number|string, object>}
 */
export const buildPromotionMap = (promoRows, itemPriceMap = {}) => {
    const groups = {};
    for (const promo of promoRows) {
        const id = promo.menu_item_id;
        if (!groups[id]) groups[id] = [];
        groups[id].push(promo);
    }
    const map = {};
    for (const [itemId, promos] of Object.entries(groups)) {
        const unitPrice = itemPriceMap[itemId] ?? 0;
        map[itemId] = pickBestPromo(promos, unitPrice);
    }
    return map;
};
