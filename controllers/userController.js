// src/controllers/userController.js
const { prisma } = require('../config/database.js');

// ✅ Récupérer tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        // Note: $regex est pour MongoDB.
        // Si vous utilisez SQL, utilisez { contains: search, mode: 'insensitive' }
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    });

    const total = await prisma.user.count({ where });

    res.json({
      data: users,
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

// ✅ Récupérer un utilisateur
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier permission: admin ou l'utilisateur lui-même
    if (req.userRole !== 'admin' && req.userId !== id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Mettre à jour profil
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, profileImage } = req.body;

    // Vérifier permission
    if (req.userRole !== 'admin' && req.userId !== id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(profileImage && { profileImage })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true
      }
    });

    res.json({ message: 'Profil mis à jour', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Supprimer utilisateur (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Changer rôle utilisateur
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });

    res.json({ message: 'Rôle mis à jour', user: { id: user.id, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Récupérer réservations utilisateur
const getUserBookings = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier permission
    if (req.userRole !== 'admin' && req.userId !== id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: id },
      include: { site: { select: { name: true, city: true, price: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Récupérer avis utilisateur
const getUserReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await prisma.review.findMany({
      where: { userId: id, status: 'approved' },
      include: { site: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  getUserBookings,
  getUserReviews
};
