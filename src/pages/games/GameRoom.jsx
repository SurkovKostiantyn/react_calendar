import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot, collection, addDoc, query, orderBy, serverTimestamp, where, getDocs } from 'firebase/firestore';
import InfoBlock from '../../components/InfoBlock';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, Button, Chip, TextField, Paper, Divider, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Collapse } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../../components/ErrorSnackbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GameField from '../../components/GameField';

const GameRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { error, errorOpen, handleError, handleCloseError } = useErrorHandler();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isTogglingReady, setIsTogglingReady] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
    const [kickDialogOpen, setKickDialogOpen] = useState(false);
    const [playerToKick, setPlayerToKick] = useState(null);
    const [gameFieldExpanded, setGameFieldExpanded] = useState(false);
    const [isTogglingGameStatus, setIsTogglingGameStatus] = useState(false);
    const [gamesPlayed, setGamesPlayed] = useState(0);
    const [wins, setWins] = useState(0);
    const [losses, setLosses] = useState(0);
    const messagesEndRef = useRef(null);
    const isRedirectingRef = useRef(false);

    useEffect(() => {
        if (!roomId || !user) return;

        const roomRef = doc(db, 'gameRooms', roomId);
        
        // Підписка на зміни кімнати в реальному часі
        const unsubscribe = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                setRoom({ id: docSnap.id, ...docSnap.data() });
                setLoading(false);
            } else {
                // Кімната видалена - встановлюємо room в null, перенаправлення відбудеся в окремому useEffect
                setRoom(null);
                setLoading(false);
            }
        }, (error) => {
            console.error("Error fetching room:", error);
            if (!isRedirectingRef.current) {
                handleError("Не вдалося завантажити кімнату", error);
            }
            setLoading(false);
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, user]);

    // Окремий useEffect для перенаправлення, коли кімната видалена
    useEffect(() => {
        if (!loading && !room && roomId && user && !isRedirectingRef.current) {
            isRedirectingRef.current = true;
            navigate('/games/testgame', { 
                state: { 
                    message: 'Кімнату було закрито власником' 
                },
                replace: true
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, room, roomId, user]);

    // Завантаження статистики ігор
    useEffect(() => {
        if (!roomId || !user) return;

        const loadGamesStats = async () => {
            try {
                const finishedGamesRef = collection(db, 'finished_games');
                const q = query(finishedGamesRef, where('roomId', '==', roomId));
                const querySnapshot = await getDocs(q);
                const games = querySnapshot.docs.map(doc => doc.data());
                
                setGamesPlayed(games.length);
                
                // Підрахунок перемог та програшів для поточного користувача
                let userWins = 0;
                let userLosses = 0;
                
                games.forEach(game => {
                    if (game.participants && game.participants.includes(user.uid)) {
                        if (game.winner && game.winner.userId === user.uid) {
                            userWins++;
                        } else {
                            userLosses++;
                        }
                    }
                });
                
                setWins(userWins);
                setLosses(userLosses);
            } catch (error) {
                console.error("Error loading games stats:", error);
            }
        };

        loadGamesStats();

        // Підписка на зміни в finished_games для цієї кімнати
        const finishedGamesRef = collection(db, 'finished_games');
        const q = query(finishedGamesRef, where('roomId', '==', roomId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const games = snapshot.docs.map(doc => doc.data());
            
            setGamesPlayed(games.length);
            
            // Підрахунок перемог та програшів для поточного користувача
            let userWins = 0;
            let userLosses = 0;
            
            games.forEach(game => {
                if (game.participants && game.participants.includes(user.uid)) {
                    if (game.winner && game.winner.userId === user.uid) {
                        userWins++;
                    } else {
                        userLosses++;
                    }
                }
            });
            
            setWins(userWins);
            setLosses(userLosses);
        }, (error) => {
            console.error("Error subscribing to games stats:", error);
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, user]);

    const isParticipant = room?.participants?.some(p => p.userId === user?.uid) || false;

    // Підписка на повідомлення чату
    useEffect(() => {
        if (!roomId || !isParticipant) return;

        const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Оновлюємо повідомлення тільки якщо вони дійсно змінилися
            setMessages(prevMessages => {
                // Перевіряємо чи є реальні зміни
                if (messagesList.length !== prevMessages.length) {
                    return messagesList;
                }
                // Перевіряємо чи змінився вміст
                const hasChanges = messagesList.some((msg, idx) => 
                    !prevMessages[idx] || 
                    prevMessages[idx].id !== msg.id ||
                    prevMessages[idx].message !== msg.message
                );
                return hasChanges ? messagesList : prevMessages;
            });
            // Прокрутка до останнього повідомлення тільки при нових повідомленнях
            if (messagesList.length > 0) {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }, (error) => {
            console.error("Error fetching messages:", error);
            handleError("Не вдалося завантажити повідомлення", error);
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, isParticipant]);

    const handleJoinRoom = async () => {
        if (!user || !roomId) return;
        
        setIsJoining(true);
        try {
            const roomRef = doc(db, 'gameRooms', roomId);
            const roomSnap = await getDoc(roomRef);
            
            if (!roomSnap.exists()) {
                handleError("Кімнату не знайдено");
                setIsJoining(false);
                return;
            }

            const roomData = roomSnap.data();
            const isAlreadyParticipant = roomData.participants?.some(p => p.userId === user.uid);
            
            if (isAlreadyParticipant) {
                handleError("Ви вже в цій кімнаті");
                setIsJoining(false);
                return;
            }

            // Перевірка ліміту учасників
            const currentParticipantsCount = roomData.participants?.length || 0;
            const maxParticipants = roomData.maxParticipants || 6;

            if (currentParticipantsCount >= maxParticipants) {
                handleError(`Кімната заповнена. Максимум учасників: ${maxParticipants}`);
                setIsJoining(false);
                return;
            }

            const participant = {
                userId: user.uid,
                displayName: user.displayName || user.email || 'Користувач',
                email: user.email || '',
                photoURL: user.photoURL || '',
                joinedAt: new Date().toISOString(),
                ready: false
            };

            await updateDoc(roomRef, {
                participants: arrayUnion(participant)
            });

            // Додаємо системне повідомлення в чат про приєднання
            const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
            await addDoc(messagesRef, {
                type: 'system',
                message: `${user.displayName || user.email || 'Користувач'} приєднався до кімнати`,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error joining room:", error);
            handleError("Не вдалося приєднатися до кімнати", error);
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeaveRoomClick = () => {
        setLeaveDialogOpen(true);
    };

    const handleLeaveRoomConfirm = async () => {
        if (!user || !roomId || !room) return;
        
        setLeaveDialogOpen(false);
        setIsLeaving(true);
        try {
            const roomRef = doc(db, 'gameRooms', roomId);
            const participant = room.participants?.find(p => p.userId === user.uid);
            
            if (participant) {
                // Додаємо системне повідомлення в чат про вихід
                const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
                await addDoc(messagesRef, {
                    type: 'system',
                    message: `${participant.displayName || user.displayName || user.email || 'Користувач'} покинув кімнату`,
                    timestamp: serverTimestamp()
                });
                
                await updateDoc(roomRef, {
                    participants: arrayRemove(participant)
                });
                navigate('/games/testgame');
            }
        } catch (error) {
            console.error("Error leaving room:", error);
            handleError("Не вдалося покинути кімнату", error);
        } finally {
            setIsLeaving(false);
        }
    };

    const handleLeaveRoomCancel = () => {
        setLeaveDialogOpen(false);
    };

    const handleKickPlayerClick = (participant) => {
        setPlayerToKick(participant);
        setKickDialogOpen(true);
    };

    const handleKickPlayerConfirm = async () => {
        if (!user || !roomId || !room || !playerToKick || !isCreator) return;
        
        setKickDialogOpen(false);
        try {
            const roomRef = doc(db, 'gameRooms', roomId);
            
            // Додаємо системне повідомлення в чат про вигнання
            const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
            await addDoc(messagesRef, {
                type: 'system',
                message: `${playerToKick.displayName || playerToKick.email || 'Користувач'} був вигнаний з кімнати`,
                timestamp: serverTimestamp()
            });
            
            await updateDoc(roomRef, {
                participants: arrayRemove(playerToKick)
            });
            setPlayerToKick(null);
        } catch (error) {
            console.error("Error kicking player:", error);
            handleError("Не вдалося вигнати гравця", error);
            setPlayerToKick(null);
        }
    };

    const handleKickPlayerCancel = () => {
        setKickDialogOpen(false);
        setPlayerToKick(null);
    };

    const handleDeleteRoomClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteRoomConfirm = async () => {
        if (!user || !roomId || !room || !isCreator) return;
        
        setDeleteDialogOpen(false);
        setIsDeleting(true);
        try {
            const roomRef = doc(db, 'gameRooms', roomId);
            await deleteDoc(roomRef);
            navigate('/games/testgame');
        } catch (error) {
            console.error("Error deleting room:", error);
            handleError("Не вдалося видалити кімнату", error);
            setIsDeleting(false);
        }
    };

    const handleDeleteRoomCancel = () => {
        setDeleteDialogOpen(false);
    };

    const isCreator = room?.createdBy === user?.uid;
    const currentParticipant = room?.participants?.find(p => p.userId === user?.uid);
    const isReady = currentParticipant?.ready || false;
    
    // Перевірка, чи всі учасники готові
    const allParticipantsReady = room?.participants?.length > 0 && 
        room.participants.every(p => p.ready === true);
    const readyCount = room?.participants?.filter(p => p.ready).length || 0;
    const totalParticipants = room?.participants?.length || 0;
    
    // Стан гри
    const isGameStarted = room?.status === 'started';

    const handleToggleReady = async () => {
        if (!user || !roomId || !room || !isParticipant || isTogglingReady) return;

        setIsTogglingReady(true);
        try {
            const roomRef = doc(db, 'gameRooms', roomId);
            const currentParticipantData = room.participants.find(p => p.userId === user.uid);
            
            if (!currentParticipantData) {
                handleError("Не вдалося знайти вашого учасника");
                setIsTogglingReady(false);
                return;
            }

            // Створюємо оновленого учасника з зміненим статусом готовності
            const updatedParticipant = {
                ...currentParticipantData,
                ready: !currentParticipantData.ready
            };

            // Оновлюємо весь масив учасників, замінюючи тільки потрібного учасника
            const updatedParticipants = room.participants.map(p => 
                p.userId === user.uid ? updatedParticipant : p
            );

            // Оновлюємо масив одним запитом
            await updateDoc(roomRef, {
                participants: updatedParticipants
            });

            // Додаємо системне повідомлення в чат про зміну статусу готовності
            const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
            const newReadyStatus = !currentParticipantData.ready;
            const statusText = newReadyStatus ? 'готовий' : 'не готовий';
            await addDoc(messagesRef, {
                type: 'system',
                message: `${currentParticipantData.displayName || 'Користувач'} тепер ${statusText}`,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error toggling ready status:", error);
            handleError("Не вдалося змінити статус готовності", error);
        } finally {
            setIsTogglingReady(false);
        }
    };

    const handleStartGame = async () => {
        if (!user || !roomId || !room || !isCreator || isTogglingGameStatus) return;
        
        setIsTogglingGameStatus(true);
        try {
            const roomRef = doc(db, 'gameRooms', roomId);
            const newStatus = isGameStarted ? 'waiting' : 'started';
            
            await updateDoc(roomRef, {
                status: newStatus
            });
            
            // Додаємо системне повідомлення в чат
            const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
            const statusMessage = newStatus === 'started' 
                ? 'Гра розпочата!' 
                : 'Гра завершена.';
            await addDoc(messagesRef, {
                type: 'system',
                message: statusMessage,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error toggling game status:", error);
            handleError("Не вдалося змінити статус гри", error);
        } finally {
            setIsTogglingGameStatus(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !roomId || !isParticipant || isSending) return;

        setIsSending(true);
        try {
            const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
            await addDoc(messagesRef, {
                userId: user.uid,
                displayName: user.displayName || user.email || 'Користувач',
                email: user.email || '',
                photoURL: user.photoURL || '',
                message: newMessage.trim(),
                timestamp: serverTimestamp()
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            handleError("Не вдалося відправити повідомлення", error);
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (isRedirectingRef.current) {
        return <LoadingSpinner />;
    }

    if (!room) {
        return (
            <InfoBlock 
                icon={<SportsEsportsIcon color="primary" sx={{ fontSize: 32 }} />} 
                title="Помилка" 
                bgcolor="#e3f2fd"
            >
                <Typography variant="body1" color="error">
                    Кімнату не знайдено
                </Typography>
            </InfoBlock>
        );
    }

    return (
        <>
            <ErrorSnackbar errorOpen={errorOpen} error={error} handleCloseError={handleCloseError} />
            <InfoBlock 
                icon={<SportsEsportsIcon color="primary" sx={{ fontSize: 32 }} />} 
                title={`Кімната: ${room.name || 'Test Game'}`}
                bgcolor="#e3f2fd"
            >
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                            Учасники ({room.participants?.length || 0}/{room.maxParticipants || 6})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                            {isCreator && (
                                <>
                                    <Tooltip title={isReady ? "Готов" : "Не готов"}>
                                        <span>
                                            <IconButton
                                                color={isReady ? "success" : "default"}
                                                onClick={handleToggleReady}
                                                disabled={isTogglingReady}
                                            >
                                                {isReady ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip 
                                        title={
                                            isGameStarted 
                                                ? "Завершити гру" 
                                                : allParticipantsReady 
                                                    ? "Розпочати гру" 
                                                    : `Готові: ${readyCount}/${totalParticipants}. Всі учасники повинні бути готові.`
                                        }
                                    >
                                        <span>
                                            <IconButton
                                                color={isGameStarted ? "error" : "success"}
                                                onClick={handleStartGame}
                                                disabled={!isGameStarted && !allParticipantsReady}
                                            >
                                                {isGameStarted ? <StopIcon /> : <PlayArrowIcon />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Видалити кімнату">
                                        <span>
                                            <IconButton
                                                color="error"
                                                onClick={handleDeleteRoomClick}
                                                disabled={isDeleting}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </>
                            )}
                            {isParticipant && !isCreator && (
                                <>
                                    <Tooltip title={isReady ? "Готов" : "Не готов"}>
                                        <span>
                                            <IconButton
                                                color={isReady ? "success" : "default"}
                                                onClick={handleToggleReady}
                                                disabled={isTogglingReady}
                                            >
                                                {isReady ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Покинути кімнату">
                                        <span>
                                            <IconButton
                                                color="error"
                                                onClick={handleLeaveRoomClick}
                                                disabled={isLeaving}
                                            >
                                                <ExitToAppIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </>
                            )}
                            {!isParticipant && (
                                <Button
                                    variant="contained"
                                    onClick={handleJoinRoom}
                                    disabled={isJoining}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {isJoining ? 'Приєднання...' : 'Приєднатися'}
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {room.participants && room.participants.length > 0 ? (
                        <List sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, py: 0 }}>
                            {room.participants.map((participant, index) => (
                                <ListItem 
                                    key={participant.userId || index}
                                    sx={{ py: 0.75, px: 1.5 }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <Avatar 
                                            src={participant.photoURL || undefined}
                                            sx={{ width: 32, height: 32 }}
                                        >
                                            {!participant.photoURL && <PersonIcon sx={{ fontSize: 18 }} />}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText 
                                        primary={participant.displayName || participant.email || 'Користувач'}
                                        primaryTypographyProps={{ 
                                            variant: 'body2', 
                                            sx: { fontWeight: 500, fontSize: '0.875rem' } 
                                        }}
                                        secondary={participant.email}
                                        secondaryTypographyProps={{ 
                                            variant: 'caption', 
                                            sx: { fontSize: '0.7rem' } 
                                        }}
                                        sx={{ my: 0 }}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                                        {participant.userId === room.createdBy && (
                                            <Chip 
                                                label="Створив" 
                                                color="primary" 
                                                size="small"
                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                            />
                                        )}
                                        {participant.userId === user?.uid && (
                                            <Chip 
                                                label="Ви" 
                                                color="secondary" 
                                                size="small"
                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                            />
                                        )}
                                        {participant.ready && (
                                            <Chip 
                                                icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                                                label="Готов" 
                                                color="success" 
                                                size="small"
                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                            />
                                        )}
                                        {isCreator && participant.userId !== user?.uid && (
                                            <Tooltip title="Вигнати гравця">
                                                <IconButton
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handleKickPlayerClick(participant)}
                                                    sx={{ width: 28, height: 28 }}
                                                >
                                                    <PersonRemoveIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ 
                            bgcolor: '#fff', 
                            borderRadius: 2, 
                            boxShadow: 1, 
                            p: 3, 
                            textAlign: 'center' 
                        }}>
                            <Typography variant="body2" color="text.secondary">
                                Поки немає учасників у кімнаті
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Статистика */}
                <Box sx={{ mt: 2 }}>
                    <Paper
                        sx={{
                            bgcolor: '#fff',
                            borderRadius: 2,
                            boxShadow: 1,
                            p: 1.5
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 1 }}>
                            Статистика
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Зіграно ігор
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    {gamesPlayed}
                                </Typography>
                            </Box>
                            {isParticipant && (
                                <>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Перемог
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                                            {wins}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Програшів
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
                                            {losses}
                                        </Typography>
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/* Поле гри */}
                <Box sx={{ mt: 2 }}>
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            mb: 1,
                            cursor: 'pointer'
                        }}
                        onClick={() => setGameFieldExpanded(!gameFieldExpanded)}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                            Поле гри
                        </Typography>
                        <IconButton size="small">
                            {gameFieldExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>
                    <Paper
                        sx={{
                            bgcolor: '#fff',
                            borderRadius: 2,
                            boxShadow: 1,
                            minHeight: gameFieldExpanded ? '70vh' : '10vh',
                            height: gameFieldExpanded ? 'auto' : '10vh',
                            overflow: 'hidden',
                            position: 'relative',
                            transition: 'min-height 0.3s ease-in-out, height 0.3s ease-in-out'
                        }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                filter: gameFieldExpanded ? 'none' : 'blur(2px)',
                                transition: 'filter 0.3s ease-in-out',
                                p: 2,
                                overflow: 'auto',
                                boxSizing: 'border-box'
                            }}
                        >
                            {isGameStarted ? (
                                <GameField room={room} user={user} roomId={roomId} />
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60px' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Очікування початку гри...
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/* Чат */}
                {isParticipant && (
                    <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <ChatIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Чат
                            </Typography>
                        </Box>
                        <Paper 
                            sx={{ 
                                bgcolor: '#fff', 
                                borderRadius: 2, 
                                boxShadow: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                height: 400,
                                maxHeight: 400
                            }}
                        >
                            {/* Список повідомлень */}
                            <Box sx={{ 
                                flex: 1, 
                                overflowY: 'auto', 
                                p: 1.5,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5
                            }}>
                                {messages.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Поки немає повідомлень. Почніть розмову!
                                        </Typography>
                                    </Box>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwnMessage = msg.userId === user?.uid;
                                        const isSystemMessage = msg.type === 'system';
                                        
                                        // Системні повідомлення відображаються по центру з іншим стилем
                                        if (isSystemMessage) {
                                            return (
                                                <Box
                                                    key={msg.id}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        my: 0.25
                                                    }}
                                                >
                                                    <Chip
                                                        label={msg.message}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'info.light',
                                                            color: 'info.contrastText',
                                                            fontSize: '0.75rem',
                                                            height: 'auto',
                                                            py: 0.5
                                                        }}
                                                    />
                                                </Box>
                                            );
                                        }
                                        
                                        return (
                                            <Box
                                                key={msg.id}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                                                    alignItems: 'flex-start',
                                                    gap: 1
                                                }}
                                            >
                                                {!isOwnMessage && (
                                                    <Avatar 
                                                        src={msg.photoURL || undefined} 
                                                        sx={{ width: 32, height: 32 }}
                                                    >
                                                        {!msg.photoURL && <PersonIcon />}
                                                    </Avatar>
                                                )}
                                                <Box
                                                    sx={{
                                                        maxWidth: '70%',
                                                        bgcolor: isOwnMessage ? 'primary.main' : 'grey.200',
                                                        color: isOwnMessage ? 'white' : 'text.primary',
                                                        borderRadius: 2,
                                                        p: 1,
                                                        px: 1.5
                                                    }}
                                                >
                                                    {!isOwnMessage && (
                                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                            {msg.displayName || msg.email || 'Користувач'}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                                        {msg.message}
                                                    </Typography>
                                                    {msg.timestamp && (
                                                        <Typography 
                                                            variant="caption" 
                                                            sx={{ 
                                                                display: 'block', 
                                                                mt: 0.5, 
                                                                opacity: 0.7,
                                                                fontSize: '0.7rem'
                                                            }}
                                                        >
                                                            {msg.timestamp.toDate ? 
                                                                new Date(msg.timestamp.toDate()).toLocaleTimeString('uk-UA', { 
                                                                    hour: '2-digit', 
                                                                    minute: '2-digit' 
                                                                }) : 
                                                                'зараз'
                                                            }
                                                        </Typography>
                                                    )}
                                                </Box>
                                                {isOwnMessage && (
                                                    <Avatar 
                                                        src={msg.photoURL || undefined} 
                                                        sx={{ width: 32, height: 32 }}
                                                    >
                                                        {!msg.photoURL && <PersonIcon />}
                                                    </Avatar>
                                                )}
                                            </Box>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </Box>
                            <Divider />
                            {/* Поле введення */}
                            <Box component="form" onSubmit={handleSendMessage} sx={{ p: 1.5, display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Введіть повідомлення..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={isSending}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey && newMessage.trim() && !isSending) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    sx={{ bgcolor: 'grey.50' }}
                                />
                                <Tooltip title="Відправити повідомлення">
                                    <span>
                                        <IconButton
                                            type="submit"
                                            color="primary"
                                            disabled={!newMessage.trim() || isSending}
                                        >
                                            <SendIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>
                        </Paper>
                    </Box>
                )}

                {/* Діалог підтвердження видалення кімнати */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={handleDeleteRoomCancel}
                    aria-labelledby="delete-dialog-title"
                    aria-describedby="delete-dialog-description"
                    disableRestoreFocus
                >
                    <DialogTitle id="delete-dialog-title">
                        Видалити кімнату?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="delete-dialog-description">
                            Ви впевнені, що хочете видалити цю кімнату? Цю дію неможливо скасувати. Всі повідомлення та дані кімнати будуть втрачені.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDeleteRoomCancel} color="primary" sx={{ textTransform: 'none' }}>
                            Скасувати
                        </Button>
                        <Button 
                            onClick={handleDeleteRoomConfirm} 
                            color="error" 
                            variant="contained"
                            disabled={isDeleting}
                            sx={{ textTransform: 'none' }}
                        >
                            {isDeleting ? 'Видалення...' : 'Видалити'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Діалог підтвердження виходу з кімнати */}
                <Dialog
                    open={leaveDialogOpen}
                    onClose={handleLeaveRoomCancel}
                    aria-labelledby="leave-dialog-title"
                    aria-describedby="leave-dialog-description"
                    disableRestoreFocus
                >
                    <DialogTitle id="leave-dialog-title">
                        Покинути кімнату?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="leave-dialog-description">
                            Ви впевнені, що хочете покинути цю кімнату? Ви зможете приєднатися знову пізніше.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleLeaveRoomCancel} color="primary" sx={{ textTransform: 'none' }}>
                            Скасувати
                        </Button>
                        <Button 
                            onClick={handleLeaveRoomConfirm} 
                            color="error" 
                            variant="contained"
                            disabled={isLeaving}
                            sx={{ textTransform: 'none' }}
                        >
                            {isLeaving ? 'Вихід...' : 'Покинути'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Діалог підтвердження вигнання гравця */}
                <Dialog
                    open={kickDialogOpen}
                    onClose={handleKickPlayerCancel}
                    aria-labelledby="kick-dialog-title"
                    aria-describedby="kick-dialog-description"
                    disableRestoreFocus
                >
                    <DialogTitle id="kick-dialog-title">
                        Вигнати гравця?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="kick-dialog-description">
                            Ви впевнені, що хочете вигнати гравця "{playerToKick?.displayName || playerToKick?.email || 'Користувача'}" з кімнати? Він зможе приєднатися знову пізніше.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={handleKickPlayerCancel} 
                            color="primary" 
                            sx={{ textTransform: 'none' }}
                            autoFocus
                        >
                            Скасувати
                        </Button>
                        <Button 
                            onClick={handleKickPlayerConfirm} 
                            color="error" 
                            variant="contained"
                            sx={{ textTransform: 'none' }}
                        >
                            Вигнати
                        </Button>
                    </DialogActions>
                </Dialog>
            </InfoBlock>
        </>
    );
};

export default GameRoom;

