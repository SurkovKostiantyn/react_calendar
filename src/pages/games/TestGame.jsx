import React, { useState, useEffect } from "react";
import InfoBlock from '../../components/InfoBlock';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { Box, Typography, Button, List, ListItem, ListItemButton, ListItemText, Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, Snackbar, Alert } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { db } from '../../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../../components/ErrorSnackbar';
import LoadingSpinner from '../../components/LoadingSpinner';

const TestGame = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { error, errorOpen, handleError, handleCloseError } = useErrorHandler();
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [createRoomDialogOpen, setCreateRoomDialogOpen] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [maxParticipants, setMaxParticipants] = useState(2);
    const [roomClosedMessage, setRoomClosedMessage] = useState(null);

    useEffect(() => {
        if (!user) return;

        // Підписка на зміни кімнат в реальному часі
        const q = query(
            collection(db, 'gameRooms'),
            where('gameType', '==', 'testgame'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rooms = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAvailableRooms(rooms);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching rooms:", error);
            handleError("Не вдалося завантажити кімнати", error);
            setLoading(false);
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Перевірка повідомлення про закриття кімнати з location.state
    useEffect(() => {
        if (location.state?.message) {
            setRoomClosedMessage(location.state.message);
            // Очищаємо state, щоб повідомлення не показувалося повторно при оновленні
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navigate]);

    const handleCreateRoomClick = () => {
        setRoomName(`Кімната ${user?.displayName || user?.email || 'Користувача'}`);
        setMaxParticipants(2); // Скидаємо до значення за замовчуванням
        setCreateRoomDialogOpen(true);
    };

    const handleCreateRoomConfirm = async () => {
        if (!user) {
            handleError("Будь ласка, увійдіть до системи");
            setCreateRoomDialogOpen(false);
            return;
        }

        if (!roomName.trim()) {
            handleError("Будь ласка, введіть назву кімнати");
            return;
        }

        setCreateRoomDialogOpen(false);
        setIsCreating(true);
        try {
            const newRoom = {
                gameType: 'testgame',
                name: roomName.trim(),
                createdBy: user.uid,
                createdAt: new Date().toISOString(),
                maxParticipants: maxParticipants,
                participants: [{
                    userId: user.uid,
                    displayName: user.displayName || user.email || 'Користувач',
                    email: user.email || '',
                    photoURL: user.photoURL || '',
                    joinedAt: new Date().toISOString(),
                    ready: false
                }],
                status: 'waiting'
            };

            const docRef = await addDoc(collection(db, 'gameRooms'), newRoom);
            setRoomName('');
            navigate(`/games/testgame/${docRef.id}`);
        } catch (error) {
            console.error("Error creating room:", error);
            handleError("Не вдалося створити кімнату", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateRoomCancel = () => {
        setCreateRoomDialogOpen(false);
        setRoomName('');
        setMaxParticipants(2); // Скидаємо значення
    };

    const handleJoinRoom = (roomId) => {
        navigate(`/games/testgame/${roomId}`);
    };

    const handleDeleteRoom = async (roomId, roomName, e) => {
        e.stopPropagation(); // Запобігаємо переходу на сторінку кімнати
        
        if (!window.confirm(`Ви впевнені, що хочете видалити кімнату "${roomName}"? Цю дію неможливо скасувати.`)) {
            return;
        }

        try {
            const roomRef = doc(db, 'gameRooms', roomId);
            await deleteDoc(roomRef);
        } catch (error) {
            console.error("Error deleting room:", error);
            handleError("Не вдалося видалити кімнату", error);
        }
    };

    return (
        <>
            <ErrorSnackbar errorOpen={errorOpen} error={error} handleCloseError={handleCloseError} />
            {roomClosedMessage && (
                <Snackbar
                    open={true}
                    autoHideDuration={6000}
                    onClose={() => setRoomClosedMessage(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert 
                        onClose={() => setRoomClosedMessage(null)} 
                        severity="warning" 
                        sx={{ width: '100%' }}
                    >
                        {roomClosedMessage}
                    </Alert>
                </Snackbar>
            )}
            <InfoBlock 
                icon={<SportsEsportsIcon color="primary" sx={{ fontSize: 32 }} />} 
                title="Test Game" 
                bgcolor="#e3f2fd"
            >
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Доступні кімнати
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreateRoomClick}
                            disabled={isCreating}
                            sx={{
                                bgcolor: '#1976d2',
                                textTransform: 'none',
                                borderRadius: 2,
                                boxShadow: 2,
                                '&:hover': {
                                    bgcolor: '#1565c0',
                                    boxShadow: 4,
                                },
                            }}
                        >
                            Створити кімнату
                        </Button>
                    </Box>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <LoadingSpinner />
                        </Box>
                    ) : availableRooms.length === 0 ? (
                        <Box sx={{ 
                            bgcolor: '#fff', 
                            borderRadius: 2, 
                            boxShadow: 1, 
                            p: 3, 
                            textAlign: 'center' 
                        }}>
                            <Typography variant="body2" color="text.secondary">
                                Поки немає доступних кімнат. Створіть нову кімнату, натиснувши кнопку вище.
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                            {availableRooms.map((room) => {
                                const isCreator = room.createdBy === user?.uid;
                                return (
                                    <ListItem 
                                        key={room.id} 
                                        disablePadding
                                        secondaryAction={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip 
                                                    icon={<PeopleIcon />}
                                                    label={`${room.participants?.length || 0} учасників`}
                                                    size="small"
                                                    color="primary"
                                                />
                                                {isCreator && (
                                                    <Tooltip title="Видалити кімнату">
                                                        <IconButton
                                                            edge="end"
                                                            color="error"
                                                            onClick={(e) => handleDeleteRoom(room.id, room.name || 'Без назви', e)}
                                                            sx={{ ml: 1 }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        }
                                    >
                                        <ListItemButton onClick={() => handleJoinRoom(room.id)}>
                                            <ListItemText 
                                                primary={room.name || 'Без назви'}
                                                secondary={`Створено: ${new Date(room.createdAt).toLocaleString('uk-UA')}`}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </Box>

                {/* Діалог створення кімнати */}
                <Dialog
                    open={createRoomDialogOpen}
                    onClose={handleCreateRoomCancel}
                    aria-labelledby="create-room-dialog-title"
                    aria-describedby="create-room-dialog-description"
                    disableRestoreFocus
                >
                    <DialogTitle id="create-room-dialog-title">
                        Створити кімнату
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="create-room-dialog-description" sx={{ mb: 2 }}>
                            Введіть назву для нової кімнати
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="room-name"
                            label="Назва кімнати"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && roomName.trim()) {
                                    e.preventDefault();
                                    handleCreateRoomConfirm();
                                }
                            }}
                            placeholder="Наприклад: Кімната для гри"
                        />
                        <Box sx={{ mt: 3, mb: 1 }}>
                            <Typography variant="body2" gutterBottom>
                                Максимальна кількість учасників: {maxParticipants}
                            </Typography>
                            <input
                                type="range"
                                min="2"
                                max="6"
                                value={maxParticipants}
                                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                                style={{
                                    width: '100%',
                                    marginTop: '8px'
                                }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">2</Typography>
                                <Typography variant="caption" color="text.secondary">6</Typography>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCreateRoomCancel} color="primary" sx={{ textTransform: 'none' }}>
                            Скасувати
                        </Button>
                        <Button 
                            onClick={handleCreateRoomConfirm} 
                            color="primary" 
                            variant="contained"
                            disabled={!roomName.trim() || isCreating}
                            sx={{ textTransform: 'none' }}
                        >
                            {isCreating ? 'Створення...' : 'Створити'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </InfoBlock>
        </>
    );
};

export default TestGame;

