const parseTokenPayload = () => {
    const token = sessionStorage.getItem("token");
    if (!token) return null;

    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return null;
    }
};

export const getCurrentCustomerId = () => {
    const payload = parseTokenPayload();
    return payload?.role === "customer" ? payload.id : null;
};

export const getPredictionStorageKey = (customerId = getCurrentCustomerId()) =>
    customerId ? `cadao_delivery_prediction_${customerId}` : null;

const sortPredictions = (list) =>
    [...list].sort((a, b) => new Date(a.estimated_time).getTime() - new Date(b.estimated_time).getTime());

export const readDeliveryPredictions = () => {
    const storageKey = getPredictionStorageKey();
    if (!storageKey) return [];

    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = JSON.parse(raw || "[]");
        if (!Array.isArray(parsed)) return [];

        const now = Date.now();
        const active = parsed.filter((item) => {
            if (!item?.orderCode || !item?.estimated_time) return false;
            return new Date(item.estimated_time).getTime() > now;
        });

        if (active.length !== parsed.length) {
            localStorage.setItem(storageKey, JSON.stringify(sortPredictions(active)));
        }

        return sortPredictions(active);
    } catch {
        return [];
    }
};

export const saveDeliveryPrediction = (prediction) => {
    const storageKey = getPredictionStorageKey();
    if (!storageKey || !prediction?.orderCode || !prediction?.estimated_time) return [];

    const next = sortPredictions([
        ...readDeliveryPredictions().filter((item) => item.orderCode !== prediction.orderCode),
        prediction
    ]);

    localStorage.setItem(storageKey, JSON.stringify(next));
    return next;
};

export const removeDeliveryPrediction = (orderCode) => {
    const storageKey = getPredictionStorageKey();
    if (!storageKey || !orderCode) return [];

    const next = readDeliveryPredictions().filter((item) => item.orderCode !== orderCode);
    localStorage.setItem(storageKey, JSON.stringify(next));
    return next;
};

export const updateDeliveryPredictionStatus = (orderCode, status) => {
    if (!orderCode || !status) return readDeliveryPredictions();

    if (status === "completed" || status === "cancelled") {
        return removeDeliveryPrediction(orderCode);
    }

    const next = readDeliveryPredictions().map((item) => (
        item.orderCode === orderCode ? { ...item, status } : item
    ));

    const storageKey = getPredictionStorageKey();
    if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(next));
    }

    return next;
};