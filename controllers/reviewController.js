// src/controllers/reviewController.js
const { prisma } = require("../config/database.js");

// Fonction utilitaire interne pour mettre à jour le rating du site
const updateSiteRating = async (siteId) => {
  const reviews = await prisma.review.findMany({
    where: { siteId, status: "approved" },
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  await prisma.site.update({
    where: { id: siteId },
    data: { rating: parseFloat(avgRating.toFixed(1)) },
  });
};

// ✅ Récupérer tous les avis
const getReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "approved",
      all = "false",
    } = req.query;
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });
    const skip = (page - 1) * limit;
    const isAll = all === "true";

    const where = {};
    if (status && status !== "all") where.status = status;

    const reviews = await prisma.review.findMany({
      where,
      ...(isAll ? {} : { skip: parseInt(skip), take: parseInt(limit) }),
      include: {
        user: { select: { firstName: true, lastName: true } },
        site: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.review.count({ where });

    res.json({
      data: reviews,
      ...(isAll
        ? { total }
        : {
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / limit),
            },
          }),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ Créer avis
const createReview = async (req, res) => {
  try {
    const { siteId,name, location, rating, comment } = req.body;
    // console.log("siteId:", siteId, "rating:", rating, "comment:", comment);

    // Vérifier site existe
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return res.status(404).json({ error: "Site non trouvé" });
    }

    

    const review = await prisma.review.create({
      data: {
        siteId,
        userId: req.userId,
        rating,
        comment,
        location,
        name,
        status: "approved" // Pour simplifier, on approuve directement
      },
      include: { user: true, site: true },
    });

    res.status(201).json({ message: "Avis créé", review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Récupérer avis spécifique
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        site: { select: { name: true, city: true } },
      },
    });

    if (!review) {
      return res.status(404).json({ error: "Avis non trouvé" });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Mettre à jour avis
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: "Avis non trouvé" });
    }

    if (review.userId !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(rating && { rating }),
        ...(comment && { comment }),
      },
    });

    res.json({ message: "Avis mis à jour", review: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Supprimer avis
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: "Avis non trouvé" });
    }

    if (review.userId !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    await prisma.review.delete({ where: { id } });

    res.json({ message: "Avis supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Approuver avis (admin)
const approveReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.update({
      where: { id },
      data: { status: "approved" },
    });

    // Mettre à jour rating du site
    await updateSiteRating(review.siteId);

    res.json({ message: "Avis approuvé", review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Rejeter avis (admin)
const rejectReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.update({
      where: { id },
      data: { status: "rejected" },
    });

    res.json({ message: "Avis rejeté", review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Stats des avis
const getReviewStats = async (req, res) => {
  try {
    const { siteId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { siteId, status: "approved" },
    });

    const stats = {
      totalReviews: reviews.length,
      avgRating:
        reviews.length > 0
          ? (
              reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            ).toFixed(1)
          : 0,
      distribution: {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
      },
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getReviews,
  createReview,
  getReviewById,
  updateReview,
  deleteReview,
  approveReview,
  rejectReview,
  getReviewStats,
};
