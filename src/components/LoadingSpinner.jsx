import React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

/**
 * Компонент для відображення індикатора завантаження
 * @param {Object} props
 * @param {boolean} props.fullScreen - чи показувати на весь екран (за замовчуванням false)
 * @param {Object} props.sx - додаткові стилі для Box
 */
const LoadingSpinner = ({ fullScreen = false, sx = {} }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      ...(fullScreen && { height: "100vh" }),
      ...sx,
    }}
  >
    <CircularProgress sx={{ color: "#4285F4" }} />
  </Box>
);

export default LoadingSpinner; 