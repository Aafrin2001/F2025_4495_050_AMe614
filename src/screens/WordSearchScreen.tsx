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
