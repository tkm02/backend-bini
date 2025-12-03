// src/controllers/bookingController.js
const { prisma } = require('../config/database.js');

// ✅ Créer réservation
const createBooking = async (req, res) => {
  try {
    const { siteId, startDate, endDate, numberOfPeople, notes } = req.body;

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    if (numberOfPeople > site.maxCapacity) {
      return res.status(400).json({ error: `Capacité maximale: ${site.maxCapacity}` });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = site.price * numberOfPeople * days;

    const booking = await prisma.booking.create({
      data: {
        siteId,
        userId: req.userId,
        startDate: start,
        endDate: end,
        numberOfPeople,
        totalPrice,
        notes,
        status: 'pending'
      },
      include: { site: true, user: true }
    });

    res.status(201).json({ message: 'Réservation créée', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Mes réservations
const getMyBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = { userId: req.userId };
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: { site: true },
      orderBy: { createdAt: 'desc' }
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

// ✅ Toutes réservations (admin/manager)
const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, siteId } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (siteId) where.siteId = siteId;

    const bookings = await prisma.booking.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: { user: true, site: true },
      orderBy: { createdAt: 'desc' }
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

// ✅ Réservation spécifique
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { site: true, user: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    if (booking.userId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Mettre à jour réservation
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, numberOfPeople, notes } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    if (booking.userId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(numberOfPeople && { numberOfPeople }),
        ...(notes && { notes })
      }
    });

    res.json({ message: 'Réservation mise à jour', booking: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Annuler réservation
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    if (booking.userId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    res.json({ message: 'Réservation annulée', booking: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Confirmer réservation (admin)
const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'confirmed' }
    });

    res.json({ message: 'Réservation confirmée', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Compléter réservation (admin)
const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'completed' }
    });

    res.json({ message: 'Réservation complétée', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  confirmBooking,
  completeBooking
};
