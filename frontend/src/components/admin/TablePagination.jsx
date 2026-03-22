const TablePagination = ({ page, totalPages, totalItems, onPageChange }) => {
    if (!totalItems) {
        return null;
    }

    const goToPrev = () => {
        if (page > 1) {
            onPageChange(page - 1);
        }
    };

    const goToNext = () => {
        if (page < totalPages) {
            onPageChange(page + 1);
        }
    };

    return (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">
                Tổng mục: <span className="font-semibold text-slate-700">{totalItems}</span>
            </p>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={goToPrev}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Trước
                </button>

                <span className="text-sm font-medium text-slate-700">
                    Trang {page}/{Math.max(1, totalPages)}
                </span>

                <button
                    type="button"
                    onClick={goToNext}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Sau
                </button>
            </div>
        </div>
    );
};

export default TablePagination;
