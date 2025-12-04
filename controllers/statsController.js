// src/controllers/statsController.js
const { prisma } = require('../config/database.js');

// ✅ Stats dashboard (public)
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalSites = await prisma.site.count();
    const totalBookings = await prisma.booking.count();
    const totalReviews = await prisma.review.count();

    const avgRating = await prisma.review.aggregate({
      _avg: { rating: true }
    });

    res.json({
      totalUsers,
      totalSites,
      totalBookings, 
      totalReviews,
      avgRating: avgRating._avg.rating?.toFixed(1) || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Résumé stats
const getStatsSummary = async (req, res) => {
  try {
    const [users, sites, bookings, reviews] = await Promise.all([
      prisma.user.count(),
      prisma.site.count(),
      prisma.booking.count(),
      prisma.review.count()
    ]);

    const bookingStats = await prisma.booking.groupBy({
      by: ['status'],
      _count: true
    });

    res.json({
      summary: { users, sites, bookings, reviews },
      bookingsByStatus: bookingStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Stats utilisateurs (admin)
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    const managerCount = await prisma.user.count({ where: { role: 'Superviseur' } });
    const userCount = await prisma.user.count({ where: { role: 'user' } });

    res.json({
      totalUsers,
      byRole: { admin: adminCount, manager: managerCount, user: userCount }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Stats sites (admin/manager)
const getSiteStats = async (req, res) => {
  try {
    const totalSites = await prisma.site.count();
    const activeSites = await prisma.site.count({ where: { isActive: true } });

    const avgRating = await prisma.site.aggregate({
      _avg: { rating: true }
    });

    res.json({
      totalSites,
      activeSites,
      avgRating: avgRating._avg.rating?.toFixed(1) || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Stats réservations (admin)
const getBookingStats = async (req, res) => {
  try {
    const stats = await prisma.booking.groupBy({
      by: ['status'],
      _count: true,
      _sum: { totalPrice: true }
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Stats revenu (admin)
const getRevenueStats = async (req, res) => {
  try {
    const revenue = await prisma.booking.aggregate({
      _sum: { totalPrice: true },
      _avg: { totalPrice: true },
      _count: true
    });

    res.json({
      totalRevenue: revenue._sum.totalPrice || 0,
      avgReservation: revenue._avg.totalPrice?.toFixed(2) || 0,
      totalBookings: revenue._count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Stats avis (admin)
const getReviewStats = async (req, res) => {
  try {
    const totalReviews = await prisma.review.count();

    const approvedReviews = await prisma.review.count({ where: { status: 'approved' } });
    const pendingReviews = await prisma.review.count({ where: { status: 'pending' } });

    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      _count: true
    });

    const avgRating = await prisma.review.aggregate({
      _avg: { rating: true }
    });

    res.json({
      totalReviews,
      byStatus: { approved: approvedReviews, pending: pendingReviews },
      ratingDistribution,
      avgRating: avgRating._avg.rating || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getStatsSummary,
  getUserStats,
  getSiteStats,
  getBookingStats,
  getRevenueStats,
  getReviewStats
};
