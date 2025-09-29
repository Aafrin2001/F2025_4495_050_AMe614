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

interface WordSearchScreenProps {
  onBack: () => void;
  onComplete: (data: GameData) => void;
}

interface GameData {
  score: number;
  time: number; // in seconds
  wordsFound: number;
  completed: boolean;
}

interface Word {
  text: string;
  found: boolean;
  hint: string;
}

interface Cell {
  letter: string;
  isSelected: boolean;
  isFound: boolean;
  row: number;
  col: number;
}

const WordSearchScreen: React.FC<WordSearchScreenProps> = ({ onBack, onComplete }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);

  const gameWords = [
    { text: 'HEALTH', hint: 'Your physical well-being' },
    { text: 'WALK', hint: 'Gentle exercise for seniors' },
    { text: 'SLEEP', hint: 'Rest your body needs' },
    { text: 'EAT', hint: 'Nourish your body' },
    { text: 'SMILE', hint: 'Show happiness' },
    { text: 'LOVE', hint: 'Deep affection' },
    { text: 'HOPE', hint: 'Positive expectation' },
    { text: 'PEACE', hint: 'Calm and quiet' },
  ];

  const gridSize = 12;

  useEffect(() => {
    if (gameStarted && !gameCompleted) {
      const timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameCompleted]);

  const initializeGame = () => {
    // Create empty grid
    const newGrid: Cell[][] = [];
    for (let row = 0; row < gridSize; row++) {
      newGrid[row] = [];
      for (let col = 0; col < gridSize; col++) {
        newGrid[row][col] = {
          letter: '',
          isSelected: false,
          isFound: false,
          row,
          col
        };
      }
    }

    // Place words in grid
    const wordsToPlace = [...gameWords];
    const placedWords: string[] = [];

    wordsToPlace.forEach(wordObj => {
      const word = wordObj.text;
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 50) {
        const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);

        if (canPlaceWord(newGrid, word, row, col, direction)) {
          placeWord(newGrid, word, row, col, direction);
          placedWords.push(word);
          placed = true;
        }
        attempts++;
      }
    });

    // Fill remaining cells with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (newGrid[row][col].letter === '') {
          newGrid[row][col].letter = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }

    setGrid(newGrid);
    setWords(gameWords.map(w => ({ ...w, found: false })));
    setGameStarted(true);
    setGameCompleted(false);
    setSelectedCells([]);
    setFoundWords([]);
    setTime(0);
    setScore(0);
  };

  const canPlaceWord = (grid: Cell[][], word: string, row: number, col: number, direction: string): boolean => {
    if (direction === 'horizontal') {
      if (col + word.length > gridSize) return false;
      for (let i = 0; i < word.length; i++) {
        if (grid[row][col + i].letter !== '' && grid[row][col + i].letter !== word[i]) {
          return false;
        }
      }
    } else {
      if (row + word.length > gridSize) return false;
      for (let i = 0; i < word.length; i++) {
        if (grid[row + i][col].letter !== '' && grid[row + i][col].letter !== word[i]) {
          return false;
        }
      }
    }
    return true;
  };

  const placeWord = (grid: Cell[][], word: string, row: number, col: number, direction: string) => {
    for (let i = 0; i < word.length; i++) {
      if (direction === 'horizontal') {
        grid[row][col + i].letter = word[i];
      } else {
        grid[row + i][col].letter = word[i];
      }
    }
  };

  const handleCellPress = (cell: Cell) => {
    if (gameCompleted || cell.isFound) return;

    const newSelectedCells = [...selectedCells, cell];
    setSelectedCells(newSelectedCells);

    // Update grid with selection
    setGrid(grid.map(row => 
      row.map(c => 
        c.row === cell.row && c.col === cell.col 
          ? { ...c, isSelected: true }
          : c
      )
    ));

    if (newSelectedCells.length >= 3) {
      checkForWord(newSelectedCells);
    }
  };

  const checkForWord = (cells: Cell[]) => {
    const selectedWord = cells.map(c => c.letter).join('');
    const foundWord = words.find(w => w.text === selectedWord && !w.found);

    if (foundWord) {
      // Word found!
      setWords(words.map(w => 
        w.text === foundWord.text ? { ...w, found: true } : w
      ));
      setFoundWords([...foundWords, foundWord.text]);
      setScore(prev => prev + 100);

      // Mark cells as found
      setGrid(grid.map(row => 
        row.map(c => 
          cells.some(selected => selected.row === c.row && selected.col === c.col)
            ? { ...c, isFound: true, isSelected: false }
            : { ...c, isSelected: false }
        )
      ));

      setSelectedCells([]);

      // Check if all words found
      const allFound = words.every(w => w.text === foundWord.text || w.found);
      if (allFound) {
        completeGame();
      }
    } else {
      // No word found - clear selection after delay
      setTimeout(() => {
        setGrid(grid.map(row => 
          row.map(c => ({ ...c, isSelected: false }))
        ));
        setSelectedCells([]);
      }, 1000);
    }
  };

  const completeGame = () => {
    setGameCompleted(true);
    const finalScore = score + Math.max(0, 500 - (time * 2));
    setScore(finalScore);

    Alert.alert(
      'Congratulations!',
      `You found all the words!\n\nScore: ${finalScore}\nTime: ${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}\nWords Found: ${foundWords.length + 1}`,
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
              wordsFound: foundWords.length + 1,
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

  const renderCell = (cell: Cell) => {
    return (
      <TouchableOpacity
        key={`${cell.row}-${cell.col}`}
        style={[
          styles.cell,
          cell.isSelected && styles.cellSelected,
          cell.isFound && styles.cellFound
        ]}
        onPress={() => handleCellPress(cell)}
      >
        <Text style={[
          styles.cellText,
          cell.isFound && styles.cellTextFound
        ]}>
          {cell.letter}
        </Text>
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
        <Text style={styles.headerTitle}>Word Search</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {!gameStarted ? (
          <View style={styles.startContainer}>
            <View style={styles.instructionCard}>
              <Ionicons name="search" size={48} color="#3F51B5" />
              <Text style={styles.instructionTitle}>Word Search Game</Text>
              <Text style={styles.instructionText}>
                Find the hidden words in the grid. Words can be horizontal or vertical. Tap letters to select them!
              </Text>
              <Text style={styles.difficultyText}>Difficulty: Medium</Text>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={initializeGame}>
              <Ionicons name="play" size={32} color="#FFFFFF" />
              <Text style={styles.buttonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.gameContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.gameStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatTime(time)}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{foundWords.length}</Text>
                <Text style={styles.statLabel}>Found</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
            </View>

            <View style={styles.gameBoard}>
              {grid.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.gridRow}>
                  {row.map((cell, colIndex) => renderCell(cell))}
                </View>
              ))}
            </View>

            <View style={styles.wordsContainer}>
              <Text style={styles.wordsTitle}>Words to Find:</Text>
              <View style={styles.wordsList}>
                {words.map((word, index) => (
                  <View key={index} style={styles.wordItem}>
                    <Text style={[
                      styles.wordText,
                      word.found && styles.wordFound
                    ]}>
                      {word.text}
                    </Text>
                    {word.found && (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.hintsContainer}>
              <Text style={styles.hintsTitle}>Hints:</Text>
              {words.map((word, index) => (
                !word.found && (
                  <Text key={index} style={styles.hintText}>
                    {word.text}: {word.hint}
                  </Text>
                )
              ))}
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
    color: '#3F51B5',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#3F51B5',
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cell: {
    width: 25,
    height: 25,
    margin: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellSelected: {
    backgroundColor: '#3F51B5',
  },
  cellFound: {
    backgroundColor: '#4CAF50',
  },
  cellText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cellTextFound: {
    color: '#FFFFFF',
  },
  wordsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  wordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  wordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 10,
  },
  wordText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginRight: 5,
  },
  wordFound: {
    textDecorationLine: 'line-through',
    color: '#4CAF50',
  },
  hintsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  hintsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
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

export default WordSearchScreen;
