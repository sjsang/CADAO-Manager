export const formatDateDDMMYYYY = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    return `${day}/${month}/${year}`;
};

export const formatElapsedTime = (startValue, endValue = Date.now()) => {
    if (!startValue) {
        return "-";
    }

    const start = new Date(startValue);
    const end = new Date(endValue);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return "-";
    }

    const totalSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
        return `${days} ngày ${hours} giờ ${minutes} phút`;
    }

    if (hours > 0) {
        return `${hours} giờ ${minutes} phút ${seconds} giây`;
    }

    if (minutes > 0) {
        return `${minutes} phút ${seconds} giây`;
    }

    return `${seconds} giây`;
};