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

// ✅ Stats PDG Dashboard (admin)
const getPdgDashboardStat = async (req, res) => {
  try {
    const getUserStats = prisma.user.count();
    const getSiteStats = prisma.site.count();
    const getBookingStats = prisma.booking.count();
    const getRevenueStats = prisma.booking.aggregate({
      _sum: { totalPrice: true }
    });
    const getReviewStats = prisma.review.aggregate({
      _avg: { rating: true }
    });
    const siteOccupancyStats = await prisma.site.findMany({
      include: {
        bookings: {
          where: { 
            status: 'completed' 
          },
          select: { 
            numberOfPeople : true
          }
        }
      }
    });

    if (!siteOccupancyStats.length) {
      return res.json({ 
        globalOccupancyRate: 0,
        totalpeopleBooked: 0, 
        totalcapacity: 0 
      });
    }

    let totalpeopleBooked = 0;
    let totalcapacity = 0;

    const siteOccupations = sites.map(site => {
      const totalpeopleBooked = site.bookings.reduce(
        (sum, b) => sum + (b.numberOfPeople || 0),
        0
      );

      const maxCapacity = site.maxCapacity || 0;

      totalPeopleAllSites += totalPeople;
      totalCapacityAllSites += maxCapacity;

      const occupationRate =
        maxCapacity > 0
          ? (totalpeopleBooked / maxCapacity) * 100
          : 0;

      return {
        totalPeople,
        maxCapacity,
        occupationRate: occupationRate
      };
    });

    // ⭐ Calcul global
    const globalOccupationRate =
      totalCapacityAllSites > 0
        ? (totalPeopleAllSites / totalCapacityAllSites) * 100
        : 0;

    return res.json({
      globalOccupationRate: Number(globalOccupationRate.toFixed(2)),
      totalPeople: totalPeopleAllSites,
      totalCapacity: totalCapacityAllSites,
      siteOccupations
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
  getReviewStats,
  getPdgDashboardStat
};
