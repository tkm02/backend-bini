// src/services/reviewService.js
import { prisma } from '../config/database.js';

export class ReviewService {
  static async getReviews(filters = {}) {
    const { siteId, userId, status = 'approved', page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {};
    if (siteId) where.siteId = siteId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const reviews = await prisma.review.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { firstName: true, lastName: true } },
        site: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.review.count({ where });

    return {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async createReview(data, userId) {
    // Vérifier si utilisateur a déjà avisé ce site
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_siteId: {
          userId,
          siteId: data.siteId
        }
      }
    });

    if (existingReview) {
      throw new Error('Vous avez déjà avisé ce site');
    }

    const review = await prisma.review.create({
      data: {
        ...data,
        userId,
        status: 'pending'
      },
      include: { user: true, site: true }
    });

    return review;
  }

  static async approveReview(reviewId) {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: 'approved' }
    });

    // Mettre à jour rating du site
    await this.updateSiteRating(review.siteId);

    return review;
  }

  static async rejectReview(reviewId) {
    return await prisma.review.update({
      where: { id: reviewId },
      data: { status: 'rejected' }
    });
  }

  static async updateSiteRating(siteId) {
    const reviews = await prisma.review.findMany({
      where: { siteId, status: 'approved' }
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    await prisma.site.update({
      where: { id: siteId },
      data: { rating: parseFloat(avgRating.toFixed(1)) }
    });
  }

  static async getReviewStats(siteId) {
    const reviews = await prisma.review.findMany({
      where: { siteId, status: 'approved' }
    });

    const stats = {
      totalReviews: reviews.length,
      avgRating: reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0,
      distribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      }
    };

    return stats;
  }
}
