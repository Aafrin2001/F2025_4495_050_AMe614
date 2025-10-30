import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface PuzzlePiecesScreenProps {
  onBack: () => void;
  onComplete: (data: GameData) => void;
}

interface GameData {
  score: number;
  time: number; // in seconds
  piecesPlaced: number;
  completed: boolean;
}

interface PuzzlePiece {
  id: string;
  number: number;
  isPlaced: boolean;
  correctPosition: number;
  currentPosition: number;
  color: string;
}

const PuzzlePiecesScreen: React.FC<PuzzlePiecesScreenProps> = ({ onBack, onComplete }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [puzzleSize, setPuzzleSize] = useState(3); // 3x3 grid
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [grid, setGrid] = useState<(PuzzlePiece | null)[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<PuzzlePiece | null>(null);
  const [piecesPlaced, setPiecesPlaced] = useState(0);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'];

  useEffect(() => {
    if (gameStarted && !gameCompleted) {
      const timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameCompleted]);

  const initializeGame = () => {
    const totalPieces = puzzleSize * puzzleSize;
    const newPieces: PuzzlePiece[] = [];
    const newGrid: (PuzzlePiece | null)[] = new Array(totalPieces).fill(null);

    // Create pieces with numbers 1 to totalPieces
    for (let i = 0; i < totalPieces; i++) {
      newPieces.push({
        id: `piece-${i}`,
        number: i + 1,
        isPlaced: false,
        correctPosition: i,
        currentPosition: -1,
        color: colors[i % colors.length]
      });
    }

    // Shuffle pieces
    const shuffledPieces = newPieces.sort(() => Math.random() - 0.5);

    setPieces(shuffledPieces);
    setGrid(newGrid);
    setGameStarted(true);
    setGameCompleted(false);
    setSelectedPiece(null);
    setPiecesPlaced(0);
    setTime(0);
    setScore(0);
    setMoves(0);
  };

  const handlePieceSelect = (piece: PuzzlePiece) => {
    if (piece.isPlaced || gameCompleted) return;
    setSelectedPiece(piece);
  };

  const handleGridPress = (position: number) => {
    if (!selectedPiece || gameCompleted) return;

    const currentGrid = [...grid];
    
    // If there's already a piece at this position, swap them
    if (currentGrid[position]) {
      const existingPiece = currentGrid[position]!;
      setPieces(pieces.map(p => 
        p.id === selectedPiece.id 
          ? { ...p, currentPosition: position }
          : p.id === existingPiece.id
          ? { ...p, currentPosition: -1 }
          : p
      ));
    } else {
      // Place the piece
      setPieces(pieces.map(p => 
        p.id === selectedPiece.id 
          ? { ...p, currentPosition: position, isPlaced: true }
          : p
      ));
      setPiecesPlaced(prev => prev + 1);
    }

    // Update grid
    currentGrid[position] = selectedPiece;
    setGrid(currentGrid);
    setMoves(prev => prev + 1);

    // Check if piece is in correct position
    if (position === selectedPiece.correctPosition) {
      setScore(prev => prev + 50);
    }

    setSelectedPiece(null);

    // Check if puzzle is complete
    const isComplete = pieces.every(piece => 
      piece.isPlaced && piece.currentPosition === piece.correctPosition
    );

    if (isComplete) {
      completeGame();
    }
  };

  const completeGame = () => {
    setGameCompleted(true);
    const timeBonus = Math.max(0, 300 - time);
    const moveBonus = Math.max(0, 50 - moves);
    const finalScore = score + timeBonus + moveBonus;

    Alert.alert(
      'Puzzle Complete!',
      `Congratulations! You solved the puzzle!\n\nScore: ${finalScore}\nTime: ${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}\nMoves: ${moves}`,
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
              piecesPlaced: piecesPlaced,
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

  const renderPuzzlePiece = (piece: PuzzlePiece) => {
    return (
      <TouchableOpacity
        key={piece.id}
        style={[
          styles.piece,
          { backgroundColor: piece.color },
          selectedPiece?.id === piece.id && styles.pieceSelected,
          piece.isPlaced && styles.piecePlaced
        ]}
        onPress={() => handlePieceSelect(piece)}
      >
        <Text style={styles.pieceText}>{piece.number}</Text>
      </TouchableOpacity>
    );
  };

  const renderGridCell = (position: number) => {
    const piece = grid[position];
    const isCorrect = piece && piece.currentPosition === piece.correctPosition;

    return (
      <TouchableOpacity
        key={position}
        style={[
          styles.gridCell,
          piece && { backgroundColor: piece.color },
          isCorrect && styles.gridCellCorrect
        ]}
        onPress={() => handleGridPress(position)}
      >
        {piece && (
          <Text style={styles.gridCellText}>{piece.number}</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (!gameStarted) {
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
          <Text style={styles.headerTitle}>Puzzle Pieces</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.startContainer}>
          <View style={styles.instructionCard}>
            <Ionicons name="extension-puzzle" size={48} color="#FF5722" />
            <Text style={styles.instructionTitle}>Puzzle Pieces Game</Text>
            <Text style={styles.instructionText}>
              Arrange the numbered pieces in the correct order. Tap a piece to select it, then tap an empty grid position to place it!
            </Text>
            <Text style={styles.difficultyText}>Difficulty: Easy</Text>
          </View>

          <View style={styles.difficultySelector}>
            <Text style={styles.difficultyLabel}>Puzzle Size:</Text>
            <View style={styles.difficultyButtons}>
              {[3, 4, 5].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.difficultyButton,
                    puzzleSize === size && styles.difficultyButtonSelected
                  ]}
                  onPress={() => setPuzzleSize(size)}
                >
                  <Text style={[
                    styles.difficultyButtonText,
                    puzzleSize === size && styles.difficultyButtonTextSelected
                  ]}>
                    {size}x{size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={initializeGame}>
            <Ionicons name="play" size={32} color="#FFFFFF" />
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

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
        <Text style={styles.headerTitle}>Puzzle Pieces</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.gameStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(time)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{piecesPlaced}</Text>
            <Text style={styles.statLabel}>Placed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
        </View>

        <View style={styles.gameArea}>
          <Text style={styles.gameTitle}>Arrange the pieces in order:</Text>
          
          <View style={styles.puzzleGrid}>
            {Array.from({ length: puzzleSize * puzzleSize }, (_, index) => 
              renderGridCell(index)
            )}
          </View>

          <Text style={styles.piecesTitle}>Available Pieces:</Text>
          <View style={styles.piecesContainer}>
            {pieces.map(renderPuzzlePiece)}
          </View>
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to Play:</Text>
          <Text style={styles.instructionItem}>1. Tap a piece to select it</Text>
          <Text style={styles.instructionItem}>2. Tap an empty grid position to place it</Text>
          <Text style={styles.instructionItem}>3. Arrange pieces in numerical order (1, 2, 3...)</Text>
          <Text style={styles.instructionItem}>4. Complete the puzzle as quickly as possible!</Text>
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
      </ScrollView>
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
  },
  startContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  instructionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
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
    color: '#FF5722',
    fontWeight: '600',
  },
  difficultySelector: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  difficultyLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  difficultyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  difficultyButtonSelected: {
    backgroundColor: '#FF5722',
  },
  difficultyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  difficultyButtonTextSelected: {
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#FF5722',
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
  gameArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  puzzleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  gridCell: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridCellCorrect: {
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  gridCellText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  piecesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  piecesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  piece: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pieceSelected: {
    borderColor: '#FF5722',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  piecePlaced: {
    opacity: 0.5,
  },
  pieceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructionsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  instructionItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    lineHeight: 20,
  },
  restartButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  restartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default PuzzlePiecesScreen;
