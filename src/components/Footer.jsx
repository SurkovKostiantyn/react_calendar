import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const Footer = () => (
    <Box
        component="footer"
        sx={{
            width: "100%",
            position: "static",
            mt: 4,
            bgcolor: "background.paper",
            py: 1,
            boxShadow: 1,
            textAlign: "center",
        }}
    >
        <Typography variant="body2" color="text.secondary">
            (c) my-alco-calendar {new Date().getFullYear()}
        </Typography>
    </Box>
);

// Spacer для відступу від футера
export const FooterSpacer = () => <Box sx={{ height: 48 }} className="footer-spacer" />;

export default Footer; 