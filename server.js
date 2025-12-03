// server.js
const app = require('./app');
const { prisma } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Vérifier connexion DB (Prisma se connecte automatiquement, mais on peut forcer pour tester)
    await prisma.$connect();
    console.log('✅ MongoDB connecté via Prisma');

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📚 API v1: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⛔ Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});
