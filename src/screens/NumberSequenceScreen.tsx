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

interface NumberSequenceScreenProps {
  onBack: () => void;
  onComplete: (data: GameData) => void;
}

interface GameData {
  score: number;
  time: number; // in seconds
  levelsCompleted: number;
  completed: boolean;
}

interface Sequence {
  id: string;
  pattern: (number | undefined)[];
  answer: number;
  options: number[];
  hint: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const NumberSequenceScreen: React.FC<NumberSequenceScreenProps> = ({ onBack, onComplete }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const gameSequences: Sequence[] = [
    {
      id: '1',
      pattern: [2, 4, 6, 8, undefined],
      answer: 10,
      options: [9, 10, 11, 12],
      hint: 'Add 2 to each number',
      difficulty: 'Easy'
    },
    {
      id: '2',
      pattern: [1, 4, 7, 10, undefined],
      answer: 13,
      options: [12, 13, 14, 15],
      hint: 'Add 3 to each number',
      difficulty: 'Easy'
    },
    {
      id: '3',
      pattern: [5, 10, 15, 20, undefined],
      answer: 25,
      options: [24, 25, 26, 27],
      hint: 'Add 5 to each number',
      difficulty: 'Easy'
    },
    {
      id: '4',
      pattern: [1, 1, 2, 3, 5, undefined],
      answer: 8,
      options: [6, 7, 8, 9],
      hint: 'Fibonacci sequence: add previous two numbers',
      difficulty: 'Medium'
    },
    {
      id: '5',
      pattern: [2, 4, 8, 16, undefined],
      answer: 32,
      options: [30, 31, 32, 33],
      hint: 'Multiply by 2 each time',
      difficulty: 'Medium'
    },
    {
      id: '6',
      pattern: [1, 4, 9, 16, undefined],
      answer: 25,
      options: [24, 25, 26, 27],
      hint: 'Square numbers: 1², 2², 3², 4²...',
      difficulty: 'Medium'
    },
    {
      id: '7',
      pattern: [3, 6, 12, 24, undefined],
      answer: 48,
      options: [46, 47, 48, 49],
      hint: 'Double each number',
      difficulty: 'Hard'
    },
    {
      id: '8',
      pattern: [1, 8, 27, 64, undefined],
      answer: 125,
      options: [124, 125, 126, 127],
      hint: 'Cube numbers: 1³, 2³, 3³, 4³...',
      difficulty: 'Hard'
    },
    {
      id: '9',
      pattern: [2, 6, 18, 54, undefined],
      answer: 162,
      options: [160, 161, 162, 163],
      hint: 'Multiply by 3 each time',
      difficulty: 'Hard'
    },
    {
      id: '10',
      pattern: [1, 3, 6, 10, undefined],
      answer: 15,
      options: [14, 15, 16, 17],
      hint: 'Triangular numbers: 1, 1+2, 1+2+3, 1+2+3+4...',
      difficulty: 'Hard'
    }
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
    // Shuffle sequences and take first 5
    const shuffledSequences = [...gameSequences].sort(() => Math.random() - 0.5).slice(0, 5);
    setSequences(shuffledSequences);
    setGameStarted(true);
    setGameCompleted(false);
    setCurrentLevel(0);
    setSelectedAnswer(null);
    setCorrectAnswers(0);
    setTime(0);
    setScore(0);
    setShowHint(false);
  };

  const handleAnswerSelect = (answer: number) => {
    if (selectedAnswer !== null || gameCompleted) return;

    setSelectedAnswer(answer);
    
    const currentSequence = sequences[currentLevel];
    const isCorrect = answer === currentSequence.answer;

    setTimeout(() => {
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);
        setScore(prev => {
          const timeBonus = Math.max(0, 30 - time);
          const difficultyMultiplier = currentSequence.difficulty === 'Easy' ? 1 : 
                                    currentSequence.difficulty === 'Medium' ? 2 : 3;
          return prev + (100 + timeBonus) * difficultyMultiplier;
        });

        if (currentLevel < sequences.length - 1) {
          setCurrentLevel(prev => prev + 1);
          setSelectedAnswer(null);
          setShowHint(false);
        } else {
          completeGame();
        }
      } else {
        Alert.alert('Incorrect', `The correct answer was ${currentSequence.answer}. Try the next one!`);
        if (currentLevel < sequences.length - 1) {
          setCurrentLevel(prev => prev + 1);
          setSelectedAnswer(null);
          setShowHint(false);
        } else {
          completeGame();
        }
      }
    }, 1000);
  };

  const completeGame = () => {
    setGameCompleted(true);
    const finalScore = score + (correctAnswers * 50); // Bonus for correct answers

    Alert.alert(
      'Game Complete!',
      `Great job! You completed the Number Sequence game!\n\nScore: ${finalScore}\nCorrect Answers: ${correctAnswers}/${sequences.length}\nTime: ${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`,
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
              levelsCompleted: correctAnswers,
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Hard': return '#F44336';
      default: return '#FFFFFF';
    }
  };

  const renderSequence = (sequence: Sequence) => {
    return sequence.pattern.map((number, index) => (
      <View key={index} style={styles.sequenceNumber}>
        <Text style={styles.sequenceText}>
          {number === undefined ? '?' : number.toString()}
        </Text>
      </View>
    ));
  };

  const renderAnswerOption = (option: number) => {
    const isSelected = selectedAnswer === option;
    const isCorrect = selectedAnswer !== null && option === sequence.answer;
    const isWrong = selectedAnswer !== null && selectedAnswer === option && option !== sequence.answer;

    return (
      <TouchableOpacity
        key={option}
        style={[
          styles.answerOption,
          isSelected && styles.answerSelected,
          isCorrect && styles.answerCorrect,
          isWrong && styles.answerWrong
        ]}
        onPress={() => handleAnswerSelect(option)}
        disabled={selectedAnswer !== null}
      >
        <Text style={[
          styles.answerText,
          isSelected && styles.answerTextSelected,
          isCorrect && styles.answerTextCorrect,
          isWrong && styles.answerTextWrong
        ]}>
          {option}
        </Text>
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
          <Text style={styles.headerTitle}>Number Sequence</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.startContainer}>
          <View style={styles.instructionCard}>
            <Ionicons name="calculator" size={48} color="#607D8B" />
            <Text style={styles.instructionTitle}>Number Sequence Game</Text>
            <Text style={styles.instructionText}>
              Find the pattern in the number sequence and select the missing number. Look for mathematical patterns!
            </Text>
            <Text style={styles.difficultyText}>Difficulty: Medium</Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={initializeGame}>
            <Ionicons name="play" size={32} color="#FFFFFF" />
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const sequence = sequences[currentLevel];

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
        <Text style={styles.headerTitle}>Number Sequence</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.gameStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(time)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{correctAnswers}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
        </View>

        <View style={styles.levelCard}>
          <Text style={styles.levelText}>
            Level {currentLevel + 1} of {sequences.length}
          </Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(sequence.difficulty) }]}>
            <Text style={styles.difficultyText}>{sequence.difficulty}</Text>
          </View>
        </View>

        <View style={styles.sequenceContainer}>
          <Text style={styles.sequenceTitle}>Find the missing number:</Text>
          <View style={styles.sequenceRow}>
            {renderSequence(sequence)}
          </View>
        </View>

        <View style={styles.answersContainer}>
          <Text style={styles.answersTitle}>Select the answer:</Text>
          <View style={styles.answersGrid}>
            {sequence.options.map(renderAnswerOption)}
          </View>
        </View>

        <View style={styles.hintContainer}>
          <TouchableOpacity 
            style={styles.hintButton}
            onPress={() => setShowHint(!showHint)}
          >
            <Ionicons name="bulb" size={20} color="#FFD700" />
            <Text style={styles.hintButtonText}>
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Text>
          </TouchableOpacity>
          
          {showHint && (
            <View style={styles.hintCard}>
              <Text style={styles.hintText}>{sequence.hint}</Text>
            </View>
          )}
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
    color: '#607D8B',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#607D8B',
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
  levelCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  sequenceContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sequenceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  sequenceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sequenceNumber: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  sequenceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  answersContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  answerOption: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  answerSelected: {
    backgroundColor: '#607D8B',
  },
  answerCorrect: {
    backgroundColor: '#4CAF50',
  },
  answerWrong: {
    backgroundColor: '#F44336',
  },
  answerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  answerTextSelected: {
    color: '#FFFFFF',
  },
  answerTextCorrect: {
    color: '#FFFFFF',
  },
  answerTextWrong: {
    color: '#FFFFFF',
  },
  hintContainer: {
    marginBottom: 20,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignSelf: 'center',
  },
  hintButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  hintCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
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

export default NumberSequenceScreen;
