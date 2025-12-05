const { prisma } = require('../config/database.js');

/**
 * Récupérer les statistiques des méthodes de paiement
 * GET /api/v1/payment-methods
 */
const getPaymentMethodStats = async (req, res) => {
  try {
    const { startDate, endDate, siteId } = req.query;

    // Construire le filtre
    const where = {
      status: {
        in: ['completed', 'confirmed']
      }
    };

    // Filtrer par date
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate);
      }
    }

    // Filtrer par site
    if (siteId && siteId !== 'all') {
      where.siteId = siteId;
    }

    console.log('🔍 Filtres payment methods:', where);

    // Récupérer les réservations
    const bookings = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        totalPrice: true,
        paymentMethod: true,
        paymentProvider: true, // ✅ Priorité à paymentProvider
        status: true,
        startDate: true,
        site: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`📊 ${bookings.length} réservations trouvées`);

    // ✅ Grouper par paymentProvider en priorité, puis paymentMethod
    const paymentStats = bookings.reduce((acc, booking) => {
      // Priorité: paymentProvider > paymentMethod > 'Non spécifié'
      const method = booking.paymentProvider || booking.paymentMethod || 'Non spécifié';
      const price = booking.totalPrice || 0;

      if (!acc[method]) {
        acc[method] = {
          method: method,
          revenue: 0,
          transactions: 0
        };
      }

      acc[method].revenue += price;
      acc[method].transactions += 1;

      return acc;
    }, {});

    // Calculer le total
    const totalRevenue = Object.values(paymentStats).reduce(
      (sum, stat) => sum + stat.revenue,
      0
    );
    const totalTransactions = Object.values(paymentStats).reduce(
      (sum, stat) => sum + stat.transactions,
      0
    );

    console.log(`💰 Revenus totaux: ${totalRevenue} CFA`);
    console.log(`🧾 Transactions totales: ${totalTransactions}`);

    // Convertir en array et calculer les pourcentages
    const paymentMethods = Object.values(paymentStats)
      .map((stat, index) => ({
        id: index + 1,
        method: stat.method,
        revenue: stat.revenue,
        transactions: stat.transactions,
        percentage: totalRevenue > 0 
          ? parseFloat(((stat.revenue / totalRevenue) * 100).toFixed(1))
          : 0,
        averageTransaction: stat.transactions > 0
          ? Math.round(stat.revenue / stat.transactions)
          : 0
      }))
      // Trier par revenus décroissants
      .sort((a, b) => b.revenue - a.revenue);

    // Si aucune donnée
    if (paymentMethods.length === 0) {
      return res.json({
        data: [],
        summary: {
          totalRevenue: 0,
          totalTransactions: 0,
          methodsCount: 0,
          message: 'Aucune transaction trouvée'
        }
      });
    }

    return res.json({
      data: paymentMethods,
      summary: {
        totalRevenue,
        totalTransactions,
        methodsCount: paymentMethods.length,
        averageTransactionValue: totalTransactions > 0
          ? Math.round(totalRevenue / totalTransactions)
          : 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur payment methods:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la récupération des méthodes de paiement' 
    });
  }
};

/**
 * Récupérer les détails d'une méthode de paiement spécifique
 * GET /api/v1/payment-methods/:method
 */
const getPaymentMethodDetails = async (req, res) => {
  try {
    const { method } = req.params;
    const { startDate, endDate, siteId } = req.query;

    const where = {
      status: {
        in: ['completed', 'confirmed']
      }
    };

    // ✅ Chercher dans paymentProvider OU paymentMethod
    if (method !== 'all') {
      where.OR = [
        { paymentProvider: method },
        { paymentMethod: method }
      ];
    }

    // Filtrer par date
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    // Filtrer par site
    if (siteId && siteId !== 'all') {
      where.siteId = siteId;
    }

    // Récupérer les transactions
    const bookings = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        reference: true,
        totalPrice: true,
        paymentMethod: true,
        paymentProvider: true,
        paymentStatus: true,
        startDate: true,
        numberOfPeople: true,
        status: true,
        visitorName: true,
        visitorEmail: true,
        visitorPhone: true,
        site: {
          select: {
            name: true,
            city: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const totalTransactions = bookings.length;

    res.json({
      method,
      totalRevenue,
      totalTransactions,
      averageTransaction: totalTransactions > 0 
        ? Math.round(totalRevenue / totalTransactions) 
        : 0,
      transactions: bookings.map(b => ({
        ...b,
        // ✅ Utiliser paymentProvider en priorité
        displayMethod: b.paymentProvider || b.paymentMethod || 'Non spécifié'
      }))
    });

  } catch (error) {
    console.error('❌ Erreur payment method details:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la récupération des détails' 
    });
  }
};

/**
 * Récupérer les tendances des méthodes de paiement par mois
 * GET /api/v1/payment-methods/trends
 */
const getPaymentMethodTrends = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Récupérer les réservations de l'année
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['completed', 'confirmed']
        },
        startDate: {
          gte: new Date(`${targetYear}-01-01`),
          lte: new Date(`${targetYear}-12-31`)
        }
      },
      select: {
        totalPrice: true,
        paymentMethod: true,
        paymentProvider: true,
        startDate: true
      }
    });

    // Grouper par mois et méthode
    const monthlyStats = {};

    bookings.forEach(booking => {
      const month = new Date(booking.startDate).getMonth() + 1; // 1-12
      // ✅ Priorité à paymentProvider
      const method = booking.paymentProvider || booking.paymentMethod || 'Non spécifié';
      const key = `${month}-${method}`;

      if (!monthlyStats[key]) {
        monthlyStats[key] = {
          month,
          method,
          revenue: 0,
          transactions: 0
        };
      }

      monthlyStats[key].revenue += booking.totalPrice || 0;
      monthlyStats[key].transactions += 1;
    });

    // Convertir en array et organiser
    const trends = Object.values(monthlyStats)
      .sort((a, b) => a.month - b.month || b.revenue - a.revenue);

    // Grouper par méthode pour avoir un résumé
    const methodSummary = {};
    trends.forEach(trend => {
      if (!methodSummary[trend.method]) {
        methodSummary[trend.method] = {
          method: trend.method,
          totalRevenue: 0,
          totalTransactions: 0,
          months: []
        };
      }
      methodSummary[trend.method].totalRevenue += trend.revenue;
      methodSummary[trend.method].totalTransactions += trend.transactions;
      methodSummary[trend.method].months.push({
        month: trend.month,
        revenue: trend.revenue,
        transactions: trend.transactions
      });
    });

    res.json({
      year: targetYear,
      trends,
      methodSummary: Object.values(methodSummary).sort((a, b) => b.totalRevenue - a.totalRevenue),
      summary: {
        totalRevenue: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        totalTransactions: bookings.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur payment trends:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la récupération des tendances' 
    });
  }
};

/**
 * Récupérer la répartition des méthodes de paiement
 * GET /api/v1/payment-methods/distribution
 */
const getPaymentMethodDistribution = async (req, res) => {
  try {
    const { siteId } = req.query;

    const where = {
      status: {
        in: ['completed', 'confirmed']
      }
    };

    if (siteId && siteId !== 'all') {
      where.siteId = siteId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      select: {
        paymentProvider: true,
        paymentMethod: true,
        totalPrice: true
      }
    });

    // Grouper par provider
    const providerStats = {};
    
    bookings.forEach(booking => {
      const provider = booking.paymentProvider || booking.paymentMethod || 'Non spécifié';
      
      if (!providerStats[provider]) {
        providerStats[provider] = {
          provider,
          count: 0,
          revenue: 0
        };
      }
      
      providerStats[provider].count += 1;
      providerStats[provider].revenue += booking.totalPrice || 0;
    });

    const distribution = Object.values(providerStats)
      .sort((a, b) => b.revenue - a.revenue);

    res.json({
      distribution,
      total: {
        bookings: bookings.length,
        revenue: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
      }
    });

  } catch (error) {
    console.error('❌ Erreur distribution:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la récupération de la distribution' 
    });
  }
};

module.exports = {
  getPaymentMethodStats,
  getPaymentMethodDetails,
  getPaymentMethodTrends,
  getPaymentMethodDistribution
};
