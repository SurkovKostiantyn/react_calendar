import React, { useState } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import WineBarIcon from '@mui/icons-material/WineBar';
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
    const { user } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (!user) return null;

    const navItems = [
        { label: "Головна", path: "/", icon: <HomeIcon /> },
        { label: "Календар", path: "/calendar", icon: <CalendarMonthIcon /> },
        { label: "Коктейлі", path: "/cocktails", icon: <LocalBarIcon /> },
        { label: "Алкомаркети", path: "/alcomarkets", icon: <ShoppingCartIcon /> },
        { label: "Досягнення", path: "/achievements", icon: <EmojiEventsIcon /> },
        { label: "Ігри", path: "/games", icon: <SportsEsportsIcon /> },
    ];

    return (
        <>
            <AppBar position="fixed" color="primary" sx={{ bgcolor: '#1976d2', color: '#fff', zIndex: 1200 }}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Box onClick={() => navigate('/')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Typography
                            variant="h5"
                            component="div"
                            sx={{
                                fontFamily: '"Exo", Arial, sans-serif',
                                fontWeight: 400,
                                letterSpacing: 2,
                                textTransform: 'uppercase',
                                fontSize: { xs: '1.1rem', sm: '1.5rem', md: '2rem' },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                minWidth: 0,
                            }}
                        >
                            <WineBarIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.7rem', md: '2.2rem' }, mb: '2px' }} />
                            <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>my-</Box>alco-calendar
                        </Typography>
                    </Box>
                    {/* Burger menu */}
                    <Box>
                        <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                        <Drawer
                            anchor="right"
                            open={drawerOpen}
                            onClose={() => setDrawerOpen(false)}
                        >
                            <Box sx={{ width: 220 }} role="presentation" onClick={() => setDrawerOpen(false)}>
                                <List>
                                    {navItems.map((item) => (
                                        <ListItem key={item.path} disablePadding>
                                            <ListItemButton onClick={() => navigate(item.path)}>
                                                {item.icon && <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>{item.icon}</Box>}
                                                <ListItemText primary={item.label} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                    <ListItem disablePadding>
                                        <ListItemButton onClick={() => navigate("/cabinet")}>
                                            <PersonIcon sx={{ mr: 1 }} />
                                            <ListItemText primary="Кабінет" />
                                        </ListItemButton>
                                    </ListItem>
                                    <ListItem disablePadding>
                                        <ListItemButton onClick={handleLogout}>
                                            <LogoutIcon sx={{ mr: 1 }} />
                                            <ListItemText primary="Вийти" />
                                        </ListItemButton>
                                    </ListItem>
                                </List>
                            </Box>
                        </Drawer>
                    </Box>
                </Toolbar>
            </AppBar>
            {/* Spacer для відступу під fixed AppBar */}
            <Toolbar />
        </>
    );
};

export default Navbar; 