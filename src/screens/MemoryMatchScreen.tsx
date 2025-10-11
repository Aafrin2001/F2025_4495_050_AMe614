import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface MemoryMatchScreenProps {
  onBack: () => void;
  onComplete: (data: GameData) => void;
}

interface GameData {
  score: number;
  time: number; // in seconds
  moves: number;
  completed: boolean;
}

interface Card {
  id: string;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  icon: string;
  color: string;
}

const MemoryMatchScreen: React.FC<MemoryMatchScreenProps> = ({ onBack, onComplete }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);

  const cardPairs = [
    { value: 'Heart', icon: 'heart', color: '#FF6B6B' },
    { value: 'Star', icon: 'star', color: '#FFD700' },
    { value: 'Flower', icon: 'flower', color: '#FF69B4' },
    { value: 'Leaf', icon: 'leaf', color: '#32CD32' },
    { value: 'Sun', icon: 'sunny', color: '#FFA500' },
    { value: 'Moon', icon: 'moon', color: '#87CEEB' },
    { value: 'Diamond', icon: 'diamond', color: '#B0C4DE' },
    { value: 'Circle', icon: 'ellipse', color: '#9370DB' },
  ];

  useEffect(() => {
    if (gameStarted && !gameCompleted) {
      const timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameCompleted]);

  const initializeGame = () => {
    const gameCards: Card[] = [];
    
    // Create pairs
    cardPairs.forEach((pair, index) => {
      gameCards.push(
        { id: `${pair.value}-1`, value: pair.value, isFlipped: false, isMatched: false, icon: pair.icon, color: pair.color },
        { id: `${pair.value}-2`, value: pair.value, isFlipped: false, isMatched: false, icon: pair.icon, color: pair.color }
      );
    });

    // Shuffle cards
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
    
    setCards(shuffledCards);
    setGameStarted(true);
    setGameCompleted(false);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTime(0);
    setScore(0);
  };

  const handleCardPress = (cardId: string) => {
    if (flippedCards.length >= 2 || gameCompleted) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setCards(cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      setTimeout(() => {
        checkForMatch(newFlippedCards);
      }, 1000);
    }
  };

  const checkForMatch = (flippedCardIds: string[]) => {
    const [card1, card2] = flippedCardIds.map(id => cards.find(c => c.id === id)!);
    
    if (card1.value === card2.value) {
      // Match found
      setCards(cards.map(c => 
        flippedCardIds.includes(c.id) ? { ...c, isMatched: true } : c
      ));
      setMatches(prev => {
        const newMatches = prev + 1;
        if (newMatches === cardPairs.length) {
          completeGame();
        }
        return newMatches;
      });
      setScore(prev => prev + 100);
    } else {
      // No match - flip cards back
      setCards(cards.map(c => 
        flippedCardIds.includes(c.id) ? { ...c, isFlipped: false } : c
      ));
    }
    
    setFlippedCards([]);
  };

  const completeGame = () => {
    setGameCompleted(true);
    const finalScore = score + Math.max(0, 1000 - (time * 10) - (moves * 5));
    setScore(finalScore);

    Alert.alert(
      'Congratulations!',
      `You completed the Memory Match game!\n\nScore: ${finalScore}\nTime: ${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}\nMoves: ${moves}`,
      [
        {
          text: 'Play Again',
          onPress: () => initializeGame()
        },
        {
          text: 'Complete Activity',
          onPress: () => {
            const gameData: GameData = {
              score: finalScore,
              time: time,
              moves: moves,
              completed: true,
            };
            onComplete(gameData);
            onBack();
          }
        }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCard = (card: Card) => {
    const isFlipped = card.isFlipped || card.isMatched;
    
    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card,
          isFlipped && styles.cardFlipped,
          card.isMatched && styles.cardMatched
        ]}
        onPress={() => handleCardPress(card.id)}
        disabled={card.isMatched}
      >
        {isFlipped ? (
          <View style={[styles.cardContent, { backgroundColor: card.color }]}>
            <Ionicons name={card.icon as any} size={32} color="#FFFFFF" />
            <Text style={styles.cardText}>{card.value}</Text>
          </View>
        ) : (
          <View style={styles.cardBack}>
            <Ionicons name="help-circle" size={32} color="rgba(255, 255, 255, 0.6)" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory Match</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {!gameStarted ? (
          <View style={styles.startContainer}>
            <View style={styles.instructionCard}>
              <Ionicons name="bulb" size={48} color="#E91E63" />
              <Text style={styles.instructionTitle}>Memory Match Game</Text>
              <Text style={styles.instructionText}>
                Find matching pairs of cards by flipping them over. Remember where each card is located!
              </Text>
              <Text style={styles.difficultyText}>Difficulty: Easy</Text>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={initializeGame}>
              <Ionicons name="play" size={32} color="#FFFFFF" />
              <Text style={styles.buttonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gameContainer}>
            <View style={styles.gameStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatTime(time)}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{moves}</Text>
                <Text style={styles.statLabel}>Moves</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
            </View>

            <View style={styles.gameBoard}>
              {cards.map(renderCard)}
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Matches: {matches} / {cardPairs.length}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(matches / cardPairs.length) * 100}%` }
                  ]} 
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.restartButton} 
              onPress={() => {
                Alert.alert(
                  'Restart Game?',
                  'Are you sure you want to restart? Your progress will be lost.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Restart', onPress: initializeGame }
                  ]
                );
              }}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.restartButtonText}>Restart</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  startContainer: {
    alignItems: 'center',
  },
  instructionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  difficultyText: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#E91E63',
    borderRadius: 50,
    paddingHorizontal: 40,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  gameContainer: {
    flex: 1,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  gameBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '22%',
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardFlipped: {
    transform: [{ rotateY: '180deg' }],
  },
  cardMatched: {
    opacity: 0.7,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  cardBack: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  progressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
});

export default MemoryMatchScreen;
