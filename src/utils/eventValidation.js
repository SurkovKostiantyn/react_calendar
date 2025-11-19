/**
 * Валідація події перед записом у Firestore
 * @param {Object} event - об'єкт події для валідації
 * @param {string} userId - ID користувача
 * @returns {{isValid: boolean, errors: string[]}} - результат валідації
 */
export function validateEvent(event, userId) {
  const errors = [];

  // Перевірка обов'язкових полів
  if (!event.start) {
    errors.push('Поле "start" (дата) є обов\'язковим');
  } else {
    // Перевірка формату дати (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(event.start)) {
      errors.push('Поле "start" має бути у форматі YYYY-MM-DD');
    } else {
      // Перевірка валідності дати
      const date = new Date(event.start);
      if (isNaN(date.getTime())) {
        errors.push('Поле "start" містить невалідну дату');
      } else {
        // Перевірка, що дата не в майбутньому (більш ніж на 1 рік)
        const now = new Date();
        const oneYearFromNow = new Date(now);
        oneYearFromNow.setFullYear(now.getFullYear() + 1);
        if (date > oneYearFromNow) {
          errors.push('Дата не може бути більш ніж на рік у майбутньому');
        }
        // Перевірка, що дата не дуже стара (більш ніж 100 років тому)
        const hundredYearsAgo = new Date(now);
        hundredYearsAgo.setFullYear(now.getFullYear() - 100);
        if (date < hundredYearsAgo) {
          errors.push('Дата не може бути більш ніж 100 років тому');
        }
      }
    }
  }

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    errors.push('Поле "userId" є обов\'язковим та має бути непустим рядком');
  }

  // Перевірка типу полів
  if (event.title !== undefined && typeof event.title !== 'string') {
    errors.push('Поле "title" має бути рядком');
  }

  if (event.displayName !== undefined && typeof event.displayName !== 'string') {
    errors.push('Поле "displayName" має бути рядком');
  }

  if (event.email !== undefined && typeof event.email !== 'string') {
    errors.push('Поле "email" має бути рядком');
  }

  if (event.photoURL !== undefined && typeof event.photoURL !== 'string' && event.photoURL !== null) {
    errors.push('Поле "photoURL" має бути рядком або null');
  }

  // Перевірка drinks - має бути масивом
  if (event.drinks !== undefined) {
    if (!Array.isArray(event.drinks)) {
      errors.push('Поле "drinks" має бути масивом');
    } else {
      // Перевірка елементів масиву drinks
      event.drinks.forEach((drink, index) => {
        if (typeof drink !== 'string') {
          errors.push(`Елемент "drinks[${index}]" має бути рядком`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Валідація оновлення події (тільки drinks)
 * @param {Array} drinks - масив напоїв
 * @returns {{isValid: boolean, errors: string[]}} - результат валідації
 */
export function validateDrinksUpdate(drinks) {
  const errors = [];

  if (!Array.isArray(drinks)) {
    errors.push('Поле "drinks" має бути масивом');
  } else {
    // Перевірка елементів масиву drinks
    drinks.forEach((drink, index) => {
      if (typeof drink !== 'string') {
        errors.push(`Елемент "drinks[${index}]" має бути рядком`);
      } else if (drink.trim() === '') {
        errors.push(`Елемент "drinks[${index}]" не може бути порожнім рядком`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

