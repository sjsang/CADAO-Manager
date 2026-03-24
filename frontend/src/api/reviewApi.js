import axiosClient from './axiosClient';

const reviewApi = {
    getFeaturedReviews: () => axiosClient.get('/reviews/featured'),
    getRecentReviews: (limit) => axiosClient.get('/reviews', { params: { limit } }),
    getReviewsForAdmin: (params = {}) => axiosClient.get('/reviews/admin', { params }),
    toggleFeatured: (id) => axiosClient.patch(`/reviews/${id}/featured`)
};

export default reviewApi;
