import axiosClient from './axiosClient';

const reviewApi = {
    getRecentReviews: (limit = 6) => axiosClient.get('/reviews', { params: { limit } }),
    getReviewsForAdmin: (params = {}) => axiosClient.get('/reviews/admin', { params })
};

export default reviewApi;
