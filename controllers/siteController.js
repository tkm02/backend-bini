// src/controllers/siteController.js
const { get } = require('http');
const { prisma } = require('../config/database.js');

// ✅ Récupérer tous les sites
const getAllSites = async (req, res) => {
  try {
    const { page = 1, limit = 11, search, city, country, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    const where = { isActive: true };
    // Attention : $regex est propre à MongoDB.
    // Si vous utilisez SQL, utilisez { contains: search, mode: 'insensitive' }
    if (search) where.name = { contains: search, mode: 'insensitive' }; 
    if (city) where.city = city;
    if (country) where.country = country;

    const sites = await prisma.site.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
        reviews: { where: { status: 'approved' } },
        manager: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    const total = await prisma.site.count({ where });

    // Calculer rating
    const siteStats = sites.map(site => ({
      ...site,
      reviewCount: site.reviews.length,
      avgRating: site.reviews.length > 0
        ? (site.reviews.reduce((sum, r) => sum + r.rating, 0) / site.reviews.length).toFixed(1)
        : 0
    }));

    res.json({
      data: siteStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getAllSitesNoPagination = async (req, res) => {
  try {
    const { search, city, country } = req.query;

    const where = { isActive: true };
    if (search) where.name = { contains: search, mode: 'insensitive' }; 
    if (city) where.city = city;
    if (country) where.country = country;

    const sites = await prisma.site.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: { where: { status: 'approved' } },
        manager: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    // Calculer rating pour chaque site
    const siteStats = sites.map(site => ({
      ...site,
      reviewCount: site.reviews.length,
      avgRating: site.reviews.length > 0
        ? (site.reviews.reduce((sum, r) => sum + r.rating, 0) / site.reviews.length).toFixed(1)
        : 0
    }));

    res.json(siteStats); // Pas de pagination, juste le tableau
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// ✅ Sites mieux notés
const getTopSites = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const sites = await prisma.site.findMany({
      where: { isActive: true },
      include: { reviews: { where: { status: 'approved' } } },
      take: parseInt(limit),
      orderBy: { rating: 'desc' }
    });

    const topSites = sites.map(site => ({
      ...site,
      avgRating: site.reviews.length > 0
        ? (site.reviews.reduce((sum, r) => sum + r.rating, 0) / site.reviews.length).toFixed(1)
        : 0
    }));

    res.json(topSites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Récupérer site spécifique
const getSiteById = async (req, res) => {
  try {
    const { id } = req.params;

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        reviews: {
          where: { status: 'approved' },
          include: { user: { select: { firstName: true, lastName: true } } }
        },
        manager: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    const response = {
      ...site,
      reviewCount: site.reviews.length,
      avgRating: site.reviews.length > 0
        ? (site.reviews.reduce((sum, r) => sum + r.rating, 0) / site.reviews.length).toFixed(1)
        : 0
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Créer site

const createSite = async (req, res) => {
  try {
    // req.body contient les champs texte
    const { 
      name, description, location, country, city, 
      latitude, longitude, price, maxCapacity, openHours, 
      tags, managerId 
    } = req.body;

    // 1. Gérer les images uploadées
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      // On crée l'URL complète pour chaque image
      imageUrls = req.files.map(file => {
        // Adaptez 'http://localhost:5000' selon votre config ou var d'env
        return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      });
    }

    const finalManagerId = managerId || req.userId || null;

    // 2. Création
    const site = await prisma.site.create({
      data: {
        name,
        description,
        location,
        country,
        city,
        price: parseFloat(price),
        maxCapacity: parseInt(maxCapacity),
        openHours: openHours || "08:00 - 18:00",
        
        // ✅ On stocke les URLs générées
        images: imageUrls,
        image: imageUrls.length > 0 ? imageUrls[0] : null, 
        
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [], // Multer peut transformer les arrays en string parfois
        
        managerId: finalManagerId,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
      include: { manager: true }
    });

    res.status(201).json({ message: 'Site créé avec images', site });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};



// ✅ Mettre à jour site
const updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Vérifier permission
    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    // if (req.userRole !== 'admin' && site.managerId !== req.userId) {
    //   return res.status(403).json({ error: 'Accès refusé' });
    // }

    const updated = await prisma.site.update({
      where: { id },
      data,
      include: { manager: true }
    });

    res.json({ message: 'Site mis à jour', site: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Supprimer site
const deleteSite = async (req, res) => {
  try {
    const { id } = req.params;

    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    // if (req.userRole !== 'admin' && site.managerId !== req.userId) {
    //   return res.status(403).json({ error: 'Accès refusé' });
    // }

    await prisma.site.delete({ where: { id } });

    res.json({ message: 'Site supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Avis du site
const getSiteReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status = 'approved' } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await prisma.review.findMany({
      where: { siteId: id, status },
      skip: parseInt(skip),
      take: parseInt(limit),
      include: { user: { select: { firstName: true, lastName: true } } }
    });

    const total = await prisma.review.count({ where: { siteId: id, status } });

    res.json({
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Réservations du site
const getSiteBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = { siteId: id };
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: { user: { select: { firstName: true, lastName: true, email: true } } }
    });

    const total = await prisma.booking.count({ where });

    res.json({
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Upload image site
const uploadSiteImage = async (req, res) => {
  try {
    // Implémenter ici la logique d'upload
    res.json({ message: 'Image uploadée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// ✅ Occupancy du site
const getSiteOccupancy = async (req, res) => {
  try {
    const { id } = req.params;
    // Implémenter la logique pour calculer l'occupation du site

    // Récupérer le site et sa capacité
    const site = await prisma.site.findUnique({
      where: { id },
      select: { maxCapacity: true }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    // Récupérer toutes les réservations du site
    const bookings = await prisma.booking.findMany({
      where: {
        siteId: id,
        status: "completed"
      },
      select: {
        numberOfPeople: true
      }
    });

    // Total de personnes réservées
    const totalPeople = bookings.reduce(
      (sum, b) => sum + (b.numberOfPeople || 0),
      0
    );

    // Calcul du taux d’occupation
    const occupationRate  =
      site.maxCapacity > 0
        ? (totalPeople / site.maxCapacity) * 100
        : 0;
    
    
    res.json({
      siteId: id,
      maxCapacity: site.maxCapacity,
      totalPeople,
      occupationRate: occupationRate
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllSites,
  getTopSites,
  getSiteById,
  createSite,
  getAllSitesNoPagination,
  updateSite,
  deleteSite,
  getSiteReviews,
  getSiteBookings,
  uploadSiteImage,
  getSiteOccupancy
};
