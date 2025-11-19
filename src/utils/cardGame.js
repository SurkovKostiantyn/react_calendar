// Утиліти для гри "21" (Blackjack)

// Створення колоди з 52 карт
export const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    suits.forEach(suit => {
        ranks.forEach(rank => {
            deck.push({ suit, rank, id: `${suit}-${rank}` });
        });
    });
    
    return shuffleDeck(deck);
};

// Перемішування колоди
const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Отримання значення карти для гри "21"
export const getCardValue = (rank) => {
    if (rank === 'A') return 11; // Туз може бути 1 або 11, але спочатку 11
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    return parseInt(rank);
};

// Підрахунок очок руки гравця
export const calculateHandValue = (cards) => {
    let total = 0;
    let aces = 0;
    
    cards.forEach(card => {
        const value = getCardValue(card.rank);
        if (card.rank === 'A') {
            aces++;
            total += 11;
        } else {
            total += value;
        }
    });
    
    // Якщо перебір і є тузи, зменшуємо їх значення до 1
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    
    return total;
};

// Перевірка чи гравець перебрав (більше 21)
export const isBusted = (cards) => {
    return calculateHandValue(cards) > 21;
};

// Перевірка чи гравець має Blackjack (21 з 2 карт)
export const isBlackjack = (cards) => {
    return cards.length === 2 && calculateHandValue(cards) === 21;
};

