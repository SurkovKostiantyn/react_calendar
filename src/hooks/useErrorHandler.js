import { useState, useCallback } from 'react';

/**
 * Хук для обробки помилок з відображенням через Snackbar
 * @returns {Object} об'єкт з error, errorOpen, handleError, handleCloseError
 */
export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [errorOpen, setErrorOpen] = useState(false);

  const handleCloseError = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setErrorOpen(false);
    setError(null);
  }, []);

  const handleError = useCallback((errorMessage, err = null) => {
    if (err) {
      console.error(errorMessage, err);
    } else {
      console.error(errorMessage);
    }
    setError(errorMessage);
    setErrorOpen(true);
  }, []);

  return {
    error,
    errorOpen,
    handleError,
    handleCloseError
  };
};

