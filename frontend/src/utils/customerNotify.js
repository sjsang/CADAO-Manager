export const notifyCustomer = ({
    message,
    type = "info",
    duration = 2600
}) => {
    if (!message || typeof window === "undefined") {
        return;
    }

    window.dispatchEvent(
        new CustomEvent("customer-toast", {
            detail: { message, type, duration }
        })
    );
};
