const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Vérifier connexion (facultatif mais utile)
prisma.$connect()
  .then(() => console.log('✅ Prisma connecté à la base de données'))
  .catch(err => console.error('❌ Erreur connexion Prisma:', err));

module.exports = {
  prisma,
};
 