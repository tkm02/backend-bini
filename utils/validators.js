// src/utils/validators.js
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // Minimum 6 caractères, 1 majuscule, 1 chiffre
  const re = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  return re.test(password);
};

export const validatePhone = (phone) => {
  const re = /^[\d\s\-\+\(\)]{10,}$/;
  return re.test(phone);
};

export const validateRating = (rating) => {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating);
};

export const validatePaginationParams = (page, limit) => {
  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 10;
  
  if (p < 1 || l < 1 || l > 100) {
    throw new Error('Paramètres de pagination invalides');
  }
  
  return { page: p, limit: l };
};
