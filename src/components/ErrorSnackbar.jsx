import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * Компонент для відображення помилок через Snackbar
 * @param {boolean} errorOpen - чи відкритий Snackbar
 * @param {string} error - повідомлення про помилку
 * @param {Function} handleCloseError - функція закриття
 */
const ErrorSnackbar = ({ errorOpen, error, handleCloseError }) => {
  if (!error) return null;

  return (
    <Snackbar 
      open={errorOpen} 
      autoHideDuration={6000} 
      onClose={handleCloseError}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
        {error}
      </Alert>
    </Snackbar>
  );
};

export default ErrorSnackbar;

