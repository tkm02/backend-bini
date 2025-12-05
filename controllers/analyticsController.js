const {prisma} = require('../config/database');

const getAdvancedAnalytics = async (req, res) => {
  try {
    // Récupérer tous les sites avec leurs bookings
    const sites = await prisma.site.findMany({
      where: { isActive: true },
      include: {
        bookings: {
          where: {
            status: { in: ['confirmed', 'completed'] }
          }
        },
        reviews: {
          where: { status: 'approved' }
        }
      }
    });

    // Calculer les métriques pour chaque site
    const sitesWithMetrics = sites.map(site => {
      // Revenus mensuels (somme des bookings du mois en cours)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const monthlyBookings = site.bookings.filter(
        b => new Date(b.createdAt) >= startOfMonth
      );
      
      const monthlyRevenue = monthlyBookings.reduce(
        (sum, b) => sum + b.totalPrice, 
        0
      );

      // Revenus totaux
      const totalRevenue = site.bookings.reduce(
        (sum, b) => sum + b.totalPrice, 
        0
      );

      // Taux d'occupation (bookings confirmés / capacité max sur 30 jours)
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentBookings = site.bookings.filter(
        b => new Date(b.createdAt) >= last30Days
      );
      
      const totalVisitors = recentBookings.reduce(
        (sum, b) => sum + b.numberOfPeople, 
        0
      );
      
      // Occupation = visiteurs réels / (capacité max * 30 jours) * 100
      const maxCapacityPerMonth = site.maxCapacity * 30;
      const occupancyRate = maxCapacityPerMonth > 0 
        ? (totalVisitors / maxCapacityPerMonth) * 100 
        : 0;

      // Note moyenne
      const avgRating = site.reviews.length > 0
        ? site.reviews.reduce((sum, r) => sum + r.rating, 0) / site.reviews.length
        : 0;

      return {
        id: site.id,
        name: site.name,
        location: site.location,
        monthlyRevenue,
        totalRevenue,
        occupancyRate: Math.min(occupancyRate, 100), // Plafonner à 100%
        totalBookings: site.bookings.length,
        totalVisitors,
        avgRating: parseFloat(avgRating.toFixed(1)),
        reviewCount: site.reviews.length
      };
    });

    // Calculer les métriques globales
    const totalVisitors = sitesWithMetrics.reduce(
      (sum, s) => sum + s.totalVisitors, 
      0
    );

    const bestRevenueSite = sitesWithMetrics.reduce(
      (max, site) => site.monthlyRevenue > max.monthlyRevenue ? site : max,
      sitesWithMetrics[0]
    );

    const bestOccupancySite = sitesWithMetrics.reduce(
      (max, site) => site.occupancyRate > max.occupancyRate ? site : max,
      sitesWithMetrics[0]
    );

    // Calculer les jours depuis le lancement (date du premier booking)
    const allBookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'asc' },
      take: 1
    });
    
    const launchDate = allBookings.length > 0 
      ? new Date(allBookings[0].createdAt)
      : new Date();
    
    const daysSinceLaunch = Math.floor(
      (Date.now() - launchDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      sites: sitesWithMetrics,
      globalMetrics: {
        totalVisitors,
        daysSinceLaunch,
        bestRevenueSite: bestRevenueSite?.name || '—',
        bestOccupancySite: bestOccupancySite?.name || '—',
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAdvancedAnalytics };
