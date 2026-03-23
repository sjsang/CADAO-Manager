const voucherRepository = require("../repositories/voucher.repository");

const createHttpError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const parseVoucherId = (id) => {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
        throw createHttpError(400, "Voucher ID không hợp lệ.");
    }

    return parsedId;
};

const parseNullableNumber = (value, fieldName, { allowZero = true } = {}) => {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        throw createHttpError(400, `${fieldName} không hợp lệ.`);
    }

    if (allowZero && parsed < 0) {
        throw createHttpError(400, `${fieldName} phải lớn hơn hoặc bằng 0.`);
    }

    if (!allowZero && parsed <= 0) {
        throw createHttpError(400, `${fieldName} phải lớn hơn 0.`);
    }

    return parsed;
};

const parseNullableInteger = (value, fieldName, { allowZero = true } = {}) => {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed)) {
        throw createHttpError(400, `${fieldName} phải là số nguyên.`);
    }

    if (allowZero && parsed < 0) {
        throw createHttpError(400, `${fieldName} phải lớn hơn hoặc bằng 0.`);
    }

    if (!allowZero && parsed <= 0) {
        throw createHttpError(400, `${fieldName} phải lớn hơn 0.`);
    }

    return parsed;
};

const parseExpiryDate = (value) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw createHttpError(400, "Ngày hết hạn không hợp lệ.");
    }

    return date.toISOString();
};

const validateVoucherPayload = (payload) => {
    const code = String(payload.code || "").trim().toUpperCase();
    const discountPercent = parseNullableInteger(payload.discountPercent, "Phần trăm giảm", { allowZero: false });
    const discountAmount = parseNullableNumber(payload.discountAmount, "Số tiền giảm", { allowZero: false });
    const minOrderValue = parseNullableNumber(payload.minOrderValue, "Giá trị đơn tối thiểu");
    const maxDiscount = parseNullableNumber(payload.maxDiscount, "Giảm tối đa");
    const usageLimit = parseNullableInteger(payload.usageLimit, "Giới hạn sử dụng", { allowZero: false });
    const expiryDate = parseExpiryDate(payload.expiryDate);
    const isActive = Boolean(payload.isActive);

    if (!code) {
        throw createHttpError(400, "Mã voucher không được để trống.");
    }

    if (discountPercent === null && discountAmount === null) {
        throw createHttpError(400, "Voucher phải có phần trăm giảm hoặc số tiền giảm.");
    }

    if (discountPercent !== null && discountAmount !== null) {
        throw createHttpError(400, "Chỉ được chọn một loại giảm giá: phần trăm hoặc số tiền.");
    }

    if (discountPercent !== null && (discountPercent < 1 || discountPercent > 100)) {
        throw createHttpError(400, "Phần trăm giảm phải từ 1 đến 100.");
    }

    if (maxDiscount !== null && discountPercent === null) {
        throw createHttpError(400, "Giảm tối đa chỉ áp dụng cho voucher giảm theo phần trăm.");
    }

    return {
        code,
        discountPercent,
        discountAmount,
        minOrderValue: minOrderValue ?? 0,
        maxDiscount,
        expiryDate,
        usageLimit,
        isActive
    };
};

const mapDatabaseError = (error) => {
    if (error.code === "23505") {
        throw createHttpError(409, "Mã voucher đã tồn tại.");
    }

    if (error.code === "23514") {
        throw createHttpError(400, "Dữ liệu voucher không hợp lệ.");
    }

    if (error.code === "23503") {
        throw createHttpError(409, "Không thể xóa voucher đã được gán cho đơn hàng.");
    }

    throw error;
};

const getVouchers = async (queryOptions) => {
    return voucherRepository.getVouchers(queryOptions);
};

const createVoucher = async (payload) => {
    const validPayload = validateVoucherPayload(payload);

    try {
        return await voucherRepository.createVoucher(validPayload);
    } catch (error) {
        mapDatabaseError(error);
    }
};

const updateVoucher = async (id, payload) => {
    const voucherId = parseVoucherId(id);
    const validPayload = validateVoucherPayload(payload);

    try {
        const voucher = await voucherRepository.updateVoucher(voucherId, validPayload);

        if (!voucher) {
            throw createHttpError(404, "Không tìm thấy voucher.");
        }

        return voucher;
    } catch (error) {
        mapDatabaseError(error);
    }
};

const deleteVoucher = async (id) => {
    const voucherId = parseVoucherId(id);

    try {
        const voucher = await voucherRepository.deleteVoucher(voucherId);

        if (!voucher) {
            throw createHttpError(404, "Không tìm thấy voucher.");
        }

        return voucher;
    } catch (error) {
        mapDatabaseError(error);
    }
};

const validateVoucherForOrder = async (code, orderValue) => {
    const normalizedCode = String(code || "").trim().toUpperCase();
    const parsedOrderValue = Number(orderValue);

    if (!normalizedCode) {
        throw createHttpError(400, "Vui lòng nhập mã voucher.");
    }

    if (!Number.isFinite(parsedOrderValue) || parsedOrderValue < 0) {
        throw createHttpError(400, "Giá trị đơn hàng không hợp lệ.");
    }

    const voucher = await voucherRepository.getVoucherByCode(normalizedCode);

    if (!voucher) {
        throw createHttpError(404, "Mã voucher không tồn tại.");
    }

    if (!voucher.is_active) {
        throw createHttpError(400, "Voucher hiện không hoạt động.");
    }

    if (voucher.expiry_date && new Date(voucher.expiry_date).getTime() < Date.now()) {
        throw createHttpError(400, "Voucher đã hết hạn.");
    }

    if (voucher.usage_limit !== null && Number(voucher.used_count) >= Number(voucher.usage_limit)) {
        throw createHttpError(400, "Voucher đã hết lượt sử dụng.");
    }

    if (parsedOrderValue < Number(voucher.min_order_value || 0)) {
        throw createHttpError(400, "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng voucher.");
    }

    let discountAmount = 0;

    if (voucher.discount_percent !== null) {
        discountAmount = (parsedOrderValue * Number(voucher.discount_percent)) / 100;

        if (voucher.max_discount !== null) {
            discountAmount = Math.min(discountAmount, Number(voucher.max_discount));
        }
    } else {
        discountAmount = Number(voucher.discount_amount || 0);
    }

    discountAmount = Math.max(0, Math.min(discountAmount, parsedOrderValue));

    return {
        voucherId: voucher.id,
        code: voucher.code,
        discountAmount,
        minOrderValue: Number(voucher.min_order_value || 0),
        usageLimit: voucher.usage_limit,
        usedCount: Number(voucher.used_count || 0),
        expiryDate: voucher.expiry_date,
        discountPercent: voucher.discount_percent,
        discountValue: voucher.discount_amount,
        maxDiscount: voucher.max_discount
    };
};

module.exports = {
    getVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    validateVoucherForOrder
};
