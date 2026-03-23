const reviewRepository = require('../repositories/review.repository');

const getRecentReviews = async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 6;
        const reviews = await reviewRepository.getRecentReviews(limit);
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Không thể tải đánh giá.' });
    }
};

const getReviewsForAdmin = async (req, res) => {
    try {
        const queryOptions = {
            search: String(req.query.search || "").trim(),
            rating: String(req.query.rating || "all").trim(),
            page: Number(req.query.page || 1),
            limit: Number(req.query.limit || 10),
            sortDir: String(req.query.sortDir || "desc").trim()
        };

        const result = await reviewRepository.getReviewsForAdmin(queryOptions);
        res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
        console.error('Error fetching admin reviews:', error);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách đánh giá.' });
    }
};

module.exports = { getRecentReviews, getReviewsForAdmin };
