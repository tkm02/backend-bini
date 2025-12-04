// src/controllers/bookingController.js
const { prisma } = require('../config/database.js');

// ✅ Créer réservation
const createBooking = async (req, res) => {
  try {
    const {
      reference,
      timestamp,
      site,
      visitor,
      booking,
      payment
    } = req.body;

    console.log("Creating booking with data:", req.body);

    // Validation des données requises
    if (!site?.id || !visitor?.name || !booking?.date || !payment?.method) {
      return res.status(400).json({ 
        error: 'Données incomplètes: site, visiteur, date et paiement requis' 
      });
    }

    // Vérifier que le site existe
    const dbSite = await prisma.site.findUnique({ 
      where: { id: site.id } 
    });
    
    if (!dbSite) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }

    // Vérifier la capacité
    if (booking.guestCount > dbSite.maxCapacity) {
      return res.status(400).json({ 
        error: `Capacité maximale: ${dbSite.maxCapacity} personnes` 
      });
    }

    // Créer la date de début complète (date + heure)
    const startDate = new Date(`${booking.date}T${booking.time}:00`);
    
    // Mapper les activités (simplifié)
    const activities = booking.activities.map(activity => ({
      id: activity.id,
      name: activity.name,
      duration: activity.duration
    }));

    // Créer la réservation
    const newBooking = await prisma.booking.create({
      data: {
        reference: reference || `BINI-${Date.now().toString(36).toUpperCase()}`,
        siteId: site.id,
        userId: req.userId || null, // Optionnel si pas connecté
        
        // Dates
        startDate: startDate,
        time: booking.time,
        
        // Visiteurs
        numberOfPeople: booking.guestCount,
        visitorName: visitor.name,
        visitorEmail: visitor.email,
        visitorPhone: visitor.phone,
        visitorCountry: visitor.country,
        visitorCity: visitor.city,
        
        // Prix
        totalPrice: booking.totalPrice || (dbSite.price * booking.guestCount),
        
        // Activités
        // activities: activities,
        
        // Paiement
        paymentMethod: payment.method,
        paymentProvider: payment.provider,
        paymentMobile: payment.mobileNumber,
        paymentStatus: payment.status || 'pending',
        
        // Statut
        status: 'pending',
        notes: booking.notes || ''
      },
      include: { 
        site: {
          select: { id: true, name: true, location: true, price: true }
        }
      }
    });

    res.status(201).json({ 
      message: 'Réservation créée avec succès', 
      booking: newBooking,
      reference: newBooking.reference
    });

  } catch (error) {
    console.error("Erreur création booking:", error);
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

    // if (booking.userId !== req.userId && req.userRole !== 'admin') {
    //   return res.status(403).json({ error: 'Accès refusé' });
    // }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBookingByReference = async (req,res) => {
    const { refCode } =  req.params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { reference: refCode },
      include: { site: true, user: true }
    });
    console.log("Booking found for refCode", refCode, ":", booking);
    return res.json(booking);
  } catch (error) {
    return null;
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

    // if (booking.userId !== req.userId && req.userRole !== 'admin') {
    //   return res.status(403).json({ error: 'Accès refusé' });
    // }

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

const updateStatus = async (req, res) => {
  try {
    const { refCode } = req.params;
    const { status } = req.body;
    console.log(status)

    const booking = await prisma.booking.findUnique({ where: { reference: refCode } });
    if (!booking) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    // if (booking.userId !== req.userId && req.userRole !== 'admin') {
    //   return res.status(403).json({ error: 'Accès refusé' });
    // }

    const updated = await prisma.booking.update({
      where: { reference: refCode },
      data: { isScanned : status }
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
  completeBooking,
  updateStatus,
  getBookingByReference
};
