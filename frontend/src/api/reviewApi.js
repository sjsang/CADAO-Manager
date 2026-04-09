import axiosClient from './axiosClient';

const reviewApi = {
    getFeaturedReviews: (params = {}) => axiosClient.get('/reviews/featured', { params }),
    getRecentReviews: (limit) => axiosClient.get('/reviews', { params: { limit } }),
    getReviewsForAdmin: (params = {}) => axiosClient.get('/reviews/admin', { params }),
    toggleFeatured: (id) => axiosClient.patch(`/reviews/${id}/featured`)
};

export default reviewApi;
