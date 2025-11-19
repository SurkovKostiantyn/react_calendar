import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Chip } from '@mui/material';
import { doc, updateDoc, getDoc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { createDeck, calculateHandValue, isBusted, isBlackjack } from '../utils/cardGame';

const GameField = ({ room, user, roomId }) => {
    const [gameState, setGameState] = useState(null);
    const [isTakingCard, setIsTakingCard] = useState(false);
    const [isPassing, setIsPassing] = useState(false);
    const [isStartingNewGame, setIsStartingNewGame] = useState(false);

    // Оновлення стану гри в реальному часі
    useEffect(() => {
        if (!roomId) return;

        const roomRef = doc(db, 'gameRooms', roomId);
        const unsubscribe = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const roomData = docSnap.data();
                if (roomData.gameState) {
                    setGameState(roomData.gameState);
                }
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    // Ініціалізація гри при старті
    useEffect(() => {
        if (room?.status === 'started' && !room?.gameState && room?.participants?.length > 0) {
            initializeGame();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room?.status, room?.gameState]);

    const initializeGame = async () => {
        try {
            // Перевірка чи гра вже ініціалізована
            const roomRef = doc(db, 'gameRooms', roomId);
            const roomSnap = await getDoc(roomRef);
            if (roomSnap.data()?.gameState) {
                return; // Гра вже ініціалізована
            }

            const deck = createDeck();
            
            // Роздаємо по 2 карти кожному гравцю
            const players = room.participants.map((participant, index) => ({
                userId: participant.userId,
                displayName: participant.displayName,
                cards: [deck[index * 2], deck[index * 2 + 1]],
                passed: false,
                turnOrder: index
            }));

            // Отримуємо поточний номер гри (інкрементуємо якщо вже є)
            const roomData = roomSnap.data();
            const currentGameNumber = (roomData.gameNumber || 0) + 1;

            const gameState = {
                deck: deck.slice(players.length * 2),
                players,
                currentPlayerIndex: 0,
                roundEnded: false,
                gameId: null // Буде встановлено при завершенні гри
            };

            await updateDoc(roomRef, { 
                gameState,
                gameNumber: currentGameNumber
            });
        } catch (error) {
            console.error("Error initializing game:", error);
        }
    };

    const handleTakeCard = async () => {
        if (!gameState || isTakingCard) return;
        
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.userId !== user?.uid) return;
        if (currentPlayer.passed || gameState.roundEnded) return;

        setIsTakingCard(true);
        try {
            const roomRef = doc(db, 'gameRooms', roomId);
            const roomSnap = await getDoc(roomRef);
            const currentGameState = roomSnap.data().gameState;
            
            const newCard = currentGameState.deck[0];
            const updatedPlayers = currentGameState.players.map((player, index) => {
                if (index === currentGameState.currentPlayerIndex) {
                    return {
                        ...player,
                        cards: [...player.cards, newCard]
                    };
                }
                return player;
            });

            const updatedDeck = currentGameState.deck.slice(1);
            const updatedPlayer = updatedPlayers[currentGameState.currentPlayerIndex];
            
            // Перевірка чи гравець перебрав
            const busted = isBusted(updatedPlayer.cards);
            let nextPlayerIndex = currentGameState.currentPlayerIndex;
            let roundEnded = currentGameState.roundEnded;

            if (busted) {
                // Переходимо до наступного гравця
                nextPlayerIndex = (currentGameState.currentPlayerIndex + 1) % updatedPlayers.length;
                
                // Перевірка чи всі гравці завершили
                const allPassedOrBusted = updatedPlayers.every(p => 
                    p.passed || isBusted(p.cards)
                );
                
                if (allPassedOrBusted) {
                    roundEnded = true;
                }
            }

            await updateDoc(roomRef, {
                gameState: {
                    deck: updatedDeck,
                    players: updatedPlayers,
                    currentPlayerIndex: busted ? nextPlayerIndex : currentGameState.currentPlayerIndex,
                    roundEnded
                }
            });

            // Якщо раунд завершився, відправляємо повідомлення про переможця в чат та зберігаємо в finished_games
            if (roundEnded && !currentGameState.roundEnded) {
                const winner = updatedPlayers
                    .map(player => ({
                        ...player,
                        value: calculateHandValue(player.cards),
                        busted: isBusted(player.cards)
                    }))
                    .filter(p => !p.busted)
                    .sort((a, b) => b.value - a.value)[0];

                const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
                if (winner) {
                    await addDoc(messagesRef, {
                        type: 'system',
                        message: `🎉 Переміг ${winner.displayName} з ${winner.value} очками!`,
                        timestamp: serverTimestamp()
                    });
                } else {
                    // Всі перебрали
                    await addDoc(messagesRef, {
                        type: 'system',
                        message: 'Всі гравці перебрали! Немає переможця.',
                        timestamp: serverTimestamp()
                    });
                }

                // Зберігаємо завершену гру в колекцію finished_games
                const roomSnapForGame = await getDoc(roomRef);
                const roomDataForGame = roomSnapForGame.data();
                const gameNumber = roomDataForGame.gameNumber || 1;
                const gameType = roomDataForGame.gameType || 'testgame';
                
                const finishedGamesRef = collection(db, 'finished_games');
                const finishedGameDocRef = await addDoc(finishedGamesRef, {
                    gameId: null // Буде встановлено нижче
                });
                
                // Збираємо список ID учасників
                const participantsIds = updatedPlayers.map(p => p.userId);
                
                const finishedGameData = {
                    gameId: finishedGameDocRef.id,
                    roomId: roomId,
                    gameType: gameType, // Додаємо тип гри
                    playersCount: updatedPlayers.length,
                    participants: participantsIds, // Додаємо список учасників
                    gameNumber: gameNumber,
                    winner: winner ? {
                        userId: winner.userId,
                        displayName: winner.displayName,
                        score: winner.value
                    } : null,
                    finishedAt: serverTimestamp()
                };
                
                // Оновлюємо документ з повними даними
                await updateDoc(finishedGameDocRef, finishedGameData);
                
                // Оновлюємо gameState з gameId
                await updateDoc(roomRef, {
                    'gameState.gameId': finishedGameDocRef.id
                });
            }
        } catch (error) {
            console.error("Error taking card:", error);
        } finally {
            setIsTakingCard(false);
        }
    };

    const handlePass = async () => {
        if (!gameState || isPassing) return;
        
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.userId !== user?.uid) return;
        if (currentPlayer.passed || gameState.roundEnded) return;

        setIsPassing(true);
        try {
            const roomRef = doc(db, 'gameRooms', roomId);
            const roomSnap = await getDoc(roomRef);
            const currentGameState = roomSnap.data().gameState;
            
            const updatedPlayers = currentGameState.players.map((player, index) => {
                if (index === currentGameState.currentPlayerIndex) {
                    return { ...player, passed: true };
                }
                return player;
            });

            const nextPlayerIndex = (currentGameState.currentPlayerIndex + 1) % updatedPlayers.length;
            
            // Перевірка чи всі гравці завершили
            const allPassedOrBusted = updatedPlayers.every(p => 
                p.passed || isBusted(p.cards)
            );

            const roundEnded = allPassedOrBusted;

            await updateDoc(roomRef, {
                gameState: {
                    ...currentGameState,
                    players: updatedPlayers,
                    currentPlayerIndex: roundEnded ? currentGameState.currentPlayerIndex : nextPlayerIndex,
                    roundEnded
                }
            });

            // Якщо раунд завершився, відправляємо повідомлення про переможця в чат та зберігаємо в finished_games
            if (roundEnded && !currentGameState.roundEnded) {
                const winner = updatedPlayers
                    .map(player => ({
                        ...player,
                        value: calculateHandValue(player.cards),
                        busted: isBusted(player.cards)
                    }))
                    .filter(p => !p.busted)
                    .sort((a, b) => b.value - a.value)[0];

                const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
                if (winner) {
                    await addDoc(messagesRef, {
                        type: 'system',
                        message: `🎉 Переміг ${winner.displayName} з ${winner.value} очками!`,
                        timestamp: serverTimestamp()
                    });
                } else {
                    // Всі перебрали
                    await addDoc(messagesRef, {
                        type: 'system',
                        message: 'Всі гравці перебрали! Немає переможця.',
                        timestamp: serverTimestamp()
                    });
                }

                // Зберігаємо завершену гру в колекцію finished_games
                const roomSnapForGame = await getDoc(roomRef);
                const roomDataForGame = roomSnapForGame.data();
                const gameNumber = roomDataForGame.gameNumber || 1;
                const gameType = roomDataForGame.gameType || 'testgame';
                
                const finishedGamesRef = collection(db, 'finished_games');
                const finishedGameDocRef = await addDoc(finishedGamesRef, {
                    gameId: null // Буде встановлено нижче
                });
                
                // Збираємо список ID учасників
                const participantsIds = updatedPlayers.map(p => p.userId);
                
                const finishedGameData = {
                    gameId: finishedGameDocRef.id,
                    roomId: roomId,
                    gameType: gameType, // Додаємо тип гри
                    playersCount: updatedPlayers.length,
                    participants: participantsIds, // Додаємо список учасників
                    gameNumber: gameNumber,
                    winner: winner ? {
                        userId: winner.userId,
                        displayName: winner.displayName,
                        score: winner.value
                    } : null,
                    finishedAt: serverTimestamp()
                };
                
                // Оновлюємо документ з повними даними
                await updateDoc(finishedGameDocRef, finishedGameData);
                
                // Оновлюємо gameState з gameId
                await updateDoc(roomRef, {
                    'gameState.gameId': finishedGameDocRef.id
                });
            }
        } catch (error) {
            console.error("Error passing:", error);
        } finally {
            setIsPassing(false);
        }
    };

    const handleStartNewGame = async () => {
        if (!user || !roomId || !room || room.createdBy !== user.uid || isStartingNewGame) return;
        
        setIsStartingNewGame(true);
        try {
            const deck = createDeck();
            
            // Роздаємо по 2 карти кожному гравцю
            const players = room.participants.map((participant, index) => ({
                userId: participant.userId,
                displayName: participant.displayName,
                cards: [deck[index * 2], deck[index * 2 + 1]],
                passed: false,
                turnOrder: index
            }));

            // Отримуємо поточний номер гри
            const roomRef = doc(db, 'gameRooms', roomId);
            const roomSnap = await getDoc(roomRef);
            const roomData = roomSnap.data();
            const currentGameNumber = (roomData.gameNumber || 0) + 1;

            const newGameState = {
                deck: deck.slice(players.length * 2),
                players,
                currentPlayerIndex: 0,
                roundEnded: false,
                gameId: null // Буде встановлено при завершенні гри
            };

            await updateDoc(roomRef, { 
                gameState: newGameState,
                gameNumber: currentGameNumber
            });
        } catch (error) {
            console.error("Error starting new game:", error);
        } finally {
            setIsStartingNewGame(false);
        }
    };

    if (!gameState) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                    Ініціалізація гри...
                </Typography>
            </Box>
        );
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isCurrentPlayer = currentPlayer?.userId === user?.uid;
    const canAct = isCurrentPlayer && !currentPlayer.passed && !gameState.roundEnded && !isBusted(currentPlayer.cards);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            {/* Черга гравців */}
            <Box sx={{ mb: 2, width: '100%', maxWidth: '100%' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Черга: {currentPlayer?.displayName || 'Очікування...'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {gameState.players.map((player, index) => {
                        const isActive = index === gameState.currentPlayerIndex;
                        const isOwnPlayer = player.userId === user?.uid;
                        const showScore = isOwnPlayer || gameState.roundEnded;
                        const playerValue = calculateHandValue(player.cards);
                        const busted = isBusted(player.cards);
                        const blackjack = isBlackjack(player.cards);
                        
                        return (
                            <Chip
                                key={player.userId}
                                label={`${player.displayName} (${showScore ? `${playerValue}${busted ? ' - Перебір!' : blackjack ? ' - Blackjack!' : ''}` : '?'})`}
                                color={isActive ? 'primary' : player.passed ? 'default' : 'secondary'}
                                variant={isActive ? 'filled' : 'outlined'}
                                size="small"
                            />
                        );
                    })}
                </Box>
            </Box>

            {/* Колода */}
            <Box sx={{ mb: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block', width: 56, height: 74 }}>
                    {/* Візуалізація колоди (3-4 карти одна на одній) */}
                    {[0, 1, 2].map((offset) => (
                        <Paper
                            key={offset}
                            sx={{
                                width: 50,
                                height: 70,
                                position: 'absolute',
                                left: offset * 3,
                                top: offset * 2,
                                bgcolor: '#1976d2',
                                border: '1px solid #1565c0',
                                borderRadius: 1,
                                boxShadow: 2
                            }}
                        />
                    ))}
                    {/* Цифра кількості карт на колоді (відцентрована відносно всієї колоди) */}
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: 'white', 
                            fontWeight: 600,
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10,
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 50,
                            height: 70
                        }}
                    >
                        {gameState.deck.length}
                    </Typography>
                </Box>
            </Box>

            {/* Карти гравців */}
            <Box sx={{ overflow: 'auto', width: '100%', maxWidth: '100%' }}>
                {gameState.players.map((player) => {
                    const playerValue = calculateHandValue(player.cards);
                    const busted = isBusted(player.cards);
                    const blackjack = isBlackjack(player.cards);
                    const isOwnCards = player.userId === user?.uid;
                    const showCards = isOwnCards || gameState.roundEnded;
                    const showScore = isOwnCards || gameState.roundEnded;
                    
                    return (
                        <Box key={player.userId} sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                                    {player.displayName}
                                    {player.userId === user?.uid && ' (Ви)'}
                                </Typography>
                                {showScore ? (
                                    <Chip 
                                        label={`Очки: ${playerValue}${busted ? ' - Перебір!' : blackjack ? ' - Blackjack!' : ''}`}
                                        color={busted ? 'error' : blackjack ? 'success' : 'default'}
                                        size="small"
                                    />
                                ) : (
                                    <Chip 
                                        label="Очки: ?"
                                        color="default"
                                        size="small"
                                    />
                                )}
                                {player.passed && (
                                    <Chip label="Досить" color="info" size="small" sx={{ ml: 1 }} />
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {player.cards.map((card, index) => (
                                    <CardComponent 
                                        key={`${card.id}-${index}`} 
                                        card={card} 
                                        hidden={!showCards}
                                    />
                                ))}
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {/* Кнопки дій */}
            {canAct && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleTakeCard}
                        disabled={isTakingCard || isPassing}
                    >
                        Взяти карту
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handlePass}
                        disabled={isTakingCard || isPassing}
                    >
                        Досить
                    </Button>
                </Box>
            )}

            {/* Результати раунду */}
            {gameState.roundEnded && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                    <Typography variant="subtitle1" sx={{ mb: 0.75, fontWeight: 600, fontSize: '0.95rem' }}>
                        Результати раунду:
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                        {gameState.players
                            .map(player => ({
                                ...player,
                                value: calculateHandValue(player.cards),
                                busted: isBusted(player.cards)
                            }))
                            .sort((a, b) => {
                                if (a.busted && !b.busted) return 1;
                                if (!a.busted && b.busted) return -1;
                                return b.value - a.value;
                            })
                            .map((player, index) => (
                                <Typography key={player.userId} variant="body2" sx={{ fontSize: '0.85rem', mb: 0.25, wordBreak: 'break-word' }}>
                                    {index + 1}. {player.displayName}: {player.busted ? 'Перебір' : `${player.value} очок`}
                                </Typography>
                            ))}
                    </Box>
                    
                    {/* Кнопка "Нова гра" - тільки для власника кімнати */}
                    {room?.createdBy === user?.uid && (
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleStartNewGame}
                                disabled={isStartingNewGame}
                                size="small"
                                sx={{ textTransform: 'none' }}
                            >
                                {isStartingNewGame ? 'Запуск...' : 'Нова гра'}
                            </Button>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};

// Компонент карти
const CardComponent = ({ card, hidden }) => {
    if (hidden) {
        return (
            <Paper
                sx={{
                    width: 45,
                    height: 63,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#1976d2',
                    color: 'white',
                    borderRadius: 1,
                    fontSize: '0.7rem'
                }}
            >
                ?
            </Paper>
        );
    }

    const isRed = card.suit === '♥' || card.suit === '♦';
    
    return (
        <Paper
            sx={{
                width: 45,
                height: 63,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'white',
                border: '1px solid #ccc',
                borderRadius: 1,
                p: 0.4
            }}
        >
            <Typography 
                variant="body2" 
                sx={{ 
                    fontWeight: 600, 
                    color: isRed ? 'error.main' : 'text.primary',
                    fontSize: '0.75rem',
                    lineHeight: 1
                }}
            >
                {card.rank}
            </Typography>
            <Typography 
                variant="body2" 
                sx={{ 
                    fontSize: '1rem',
                    color: isRed ? 'error.main' : 'text.primary',
                    lineHeight: 1
                }}
            >
                {card.suit}
            </Typography>
        </Paper>
    );
};

export default GameField;

