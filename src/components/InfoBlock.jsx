import React from "react";
import { Box, Typography } from "@mui/material";

const InfoBlock = ({ icon, title, children, bgcolor = "#f3e5f5", sx = {} }) => (
  <Box
    sx={{
      p: 2,
      bgcolor,
      borderRadius: 3,
      boxShadow: 2,
      width: '100%',
      maxWidth: '100%',
      mb: 2,
      overflowWrap: 'break-word',
      boxSizing: 'border-box',
      ...sx,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
      {icon}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, ml: 1 }}>
        {title}
      </Typography>
    </Box>
    {children}
  </Box>
);

export default InfoBlock; 