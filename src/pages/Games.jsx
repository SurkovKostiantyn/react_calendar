import React from "react";
import InfoBlock from '../components/InfoBlock';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const Games = () => {
    const navigate = useNavigate();

    return (
        <>
            <InfoBlock 
                icon={<SportsEsportsIcon color="primary" sx={{ fontSize: 32 }} />} 
                title="Ігри" 
                bgcolor="#e3f2fd"
            >
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Ігри в які можна пограти разом з друзями
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Перелік ігор
                    </Typography>
                    <List sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => navigate('/games/testgame')}>
                                <SportsEsportsIcon sx={{ mr: 2, color: 'primary.main' }} />
                                <ListItemText primary="Test Game" />
                                <PlayArrowIcon sx={{ color: 'primary.main' }} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </InfoBlock>
        </>
    );
};

export default Games;

