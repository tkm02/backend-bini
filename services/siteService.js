// src/services/siteService.js
import { prisma } from '../config/database.js';

export class SiteService {
  static async getAllSites(filters = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      city = '',
      country = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;

    // Construire le filtre
    const where = { isActive: true };
    if (search) where.name = { $regex: search, $options: 'i' };
    if (city) where.city = city;
    if (country) where.country = country;

    // Récupérer sites
    const sites = await prisma.site.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
        reviews: { where: { status: 'approved' } },
        manager: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    // Compter total
    const total = await prisma.site.count({ where });

    // Calculer stats
    const siteStats = sites.map(site => ({
      ...site,
      reviewCount: site.reviews.length,
      avgRating: site.reviews.length > 0
        ? (site.reviews.reduce((sum, r) => sum + r.rating, 0) / site.reviews.length).toFixed(1)
        : 0
    }));

    return {
      sites: siteStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getSiteById(id) {
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

    if (!site) throw new Error('Site non trouvé');

    return {
      ...site,
      reviewCount: site.reviews.length,
      avgRating: site.reviews.length > 0
        ? (site.reviews.reduce((sum, r) => sum + r.rating, 0) / site.reviews.length).toFixed(1)
        : 0
    };
  }

  static async createSite(data, managerId) {
    const site = await prisma.site.create({
      data: {
        ...data,
        managerId
      },
      include: { manager: true }
    });

    return site;
  }

  static async updateSite(id, data) {
    const site = await prisma.site.update({
      where: { id },
      data,
      include: { manager: true }
    });

    return site;
  }

  static async deleteSite(id) {
    await prisma.site.delete({ where: { id } });
  }

  static async getTopSites(limit = 5) {
    const sites = await prisma.site.findMany({
      where: { isActive: true },
      include: { reviews: { where: { status: 'approved' } } },
      take: limit,
      orderBy: { rating: 'desc' }
    });

    return sites.map(site => ({
      ...site,
      avgRating: site.reviews.length > 0
        ? (site.reviews.reduce((sum, r) => sum + r.rating, 0) / site.reviews.length).toFixed(1)
        : 0
    }));
  }
}
