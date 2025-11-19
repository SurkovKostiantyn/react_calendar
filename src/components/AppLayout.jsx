import React from "react";
import Box from "@mui/material/Box";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Toolbar from "@mui/material/Toolbar";

const AppLayout = ({ children }) => (
  <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
    <Navbar />
    <Toolbar />
    <Box sx={{ 
      flex: 1, 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center",
      width: '100%', 
      maxWidth: 500, 
      mx: 'auto', 
      px: 1, 
      boxSizing: 'border-box', 
      overflowX: 'hidden' 
    }}>
      {children}
    </Box>
    <Footer />
  </Box>
);

export default AppLayout; 