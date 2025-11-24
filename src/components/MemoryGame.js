// src/components/MemoryGameCenter.js
import React, { useState, useEffect } from 'react';
import { shuffle } from 'lodash';
import { 
  Brain, 
  RotateCcw, 
  Trophy, 
  Target, 
  Eye, 
  Volume2, 
  Hash, 
  Type,
  ArrowLeft,
  Play,
  Pause,
  Star
} from 'lucide-react';

// === MEMORY MATCH GAME ===
const MemoryMatchCard = ({ card, handleCardClick }) => {
  const { emoji, status } = card;

  const getCardStyles = () => {
    if (status === 'matched') return 'bg-black text-white border-black scale-105';
    if (status === 'mismatched') return 'bg-gray-300 text-black border-gray-400';
    return 'bg-white border-2 border-gray-300 hover:border-black hover:scale-105';
  };

  return (
    <div 
      className="w-16 h-16 md:w-20 md:h-20 [perspective:1000px] cursor-pointer" 
      onClick={handleCardClick}
    >
      <div
        className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${
          status !== 'default' ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <div className="absolute w-full h-full border-2 border-black bg-black hover:bg-gray-800 transition-colors [backface-visibility:hidden] flex items-center justify-center">
          <div className="w-2 h-2 bg-white"></div>
        </div>
        <div
          className={`absolute w-full h-full flex items-center justify-center text-2xl font-black [backface-visibility:hidden] [transform:rotateY(180deg)] transition-all duration-300 ${getCardStyles()}`}
        >
          {emoji}
        </div>
      </div>
    </div>
  );
};

const MemoryMatchGame = ({ onBack, updateScore }) => {
  const emojis = ['😊', '😂', '😎', '🤩', '🚀', '🌈', '🎉', '🌟'];
  
  const generateShuffledCards = () => {
    return shuffle([...emojis, ...emojis]).map((emoji, index) => ({
      id: index,
      emoji,
      status: 'default',
    }));
  };

  const [cards, setCards] = useState(generateShuffledCards);
  const [flippedCards, setFlippedCards] = useState([]);
  const [isBoardLocked, setIsBoardLocked] = useState(false);
  const [matchesFound, setMatchesFound] = useState(0);
  const [score, setScore] = useState(0);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (matchesFound === emojis.length && emojis.length > 0) {
      const finalScore = Math.max(100, score);
      updateScore(finalScore);
      const celebrationTimeout = setTimeout(() => {
        resetGame(true);
      }, 3000);
      return () => clearTimeout(celebrationTimeout);
    }
  }, [matchesFound, emojis.length, score, updateScore]);

  const handleCardClick = (clickedIndex) => {
    if (isBoardLocked || cards[clickedIndex].status !== 'default') return;

    const newFlippedCards = [...flippedCards, clickedIndex];
    let newCards = [...cards];
    newCards[clickedIndex].status = 'flipped';

    setFlippedCards(newFlippedCards);
    setCards(newCards);

    if (newFlippedCards.length === 2) {
      setIsBoardLocked(true);
      setTries(prev => prev + 1);
      const [firstIndex, secondIndex] = newFlippedCards;
      const firstCard = newCards[firstIndex];
      const secondCard = newCards[secondIndex];

      if (firstCard.emoji === secondCard.emoji) {
        firstCard.status = 'matched';
        secondCard.status = 'matched';
        setMatchesFound(prev => prev + 1);
        setScore(prev => prev + 100);
        setFlippedCards([]);
        setIsBoardLocked(false);
      } else {
        firstCard.status = 'mismatched';
        secondCard.status = 'mismatched';
        setScore(prev => Math.max(0, prev - 10));
        setTimeout(() => {
          firstCard.status = 'default';
          secondCard.status = 'default';
          setCards([...newCards]);
          setFlippedCards([]);
          setIsBoardLocked(false);
        }, 1000);
      }
      setCards([...newCards]);
    }
  };

  const resetGame = (isNewRound = false) => {
    setMatchesFound(0);
    setFlippedCards([]);
    setIsBoardLocked(true);
    
    if (!isNewRound) {
      setScore(0);
      setTries(0);
    }
    
    setTimeout(() => {
      setCards(generateShuffledCards());
      setIsBoardLocked(false);
    }, 500);
  };

  return (
    <div className="bg-white text-black p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 hover:bg-gray-100 p-2">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">BACK</span>
        </button>
        <div className="flex gap-4">
          <div className="border-2 border-black p-3 bg-white">
            <div className="flex items-center space-x-2 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="font-black text-sm">SCORE</span>
            </div>
            <div className="text-xl font-black font-mono">{score}</div>
          </div>
          <div className="border-2 border-black p-3 bg-white">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4" />
              <span className="font-black text-sm">TRIES</span>
            </div>
            <div className="text-xl font-black font-mono">{tries}</div>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-2xl font-black mb-2">MEMORY MATCH</h3>
        <div className="w-16 h-1 bg-black mx-auto"></div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 justify-center items-center max-w-lg mx-auto mb-6">
        {cards.map((card, index) => (
          <MemoryMatchCard key={card.id} card={card} handleCardClick={() => handleCardClick(index)} />
        ))}
      </div>

      {matchesFound === emojis.length && (
        <div className="text-center mb-6">
          <div className="bg-black text-white p-6 inline-block">
            <p className="text-xl font-black mb-2">LEVEL COMPLETE!</p>
            <p className="font-medium">Final Score: {score}</p>
          </div>
        </div>
      )}

      {matchesFound < emojis.length && (
        <div className="text-center">
          <button
            onClick={() => resetGame(false)}
            className="inline-flex items-center space-x-2 bg-black text-white px-6 py-3 font-black text-sm hover:bg-gray-800"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET</span>
          </button>
        </div>
      )}
    </div>
  );
};

// === SIMON SAYS GAME ===
const SimonSaysGame = ({ onBack, updateScore }) => {
  const colors = ['red', 'blue', 'green', 'yellow'];
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [isShowing, setIsShowing] = useState(false);
  const [activeColor, setActiveColor] = useState('');
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState('ready'); // ready, playing, game-over

  const startGame = () => {
    const newColor = colors[Math.floor(Math.random() * colors.length)];
    setSequence([newColor]);
    setPlayerSequence([]);
    setScore(0);
    setGameStatus('playing');
    showSequence([newColor]);
  };

  const showSequence = (seq) => {
    setIsShowing(true);
    seq.forEach((color, index) => {
      setTimeout(() => {
        setActiveColor(color);
        setTimeout(() => setActiveColor(''), 600);
      }, (index + 1) * 800);
    });
    setTimeout(() => setIsShowing(false), seq.length * 800 + 600);
  };

  const handleColorClick = (color) => {
    if (isShowing) return;

    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);

    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      setGameStatus('game-over');
      updateScore(score * 10);
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      const newScore = score + 1;
      setScore(newScore);
      const newColor = colors[Math.floor(Math.random() * colors.length)];
      const newSequence = [...sequence, newColor];
      setSequence(newSequence);
      setPlayerSequence([]);
      
      setTimeout(() => {
        showSequence(newSequence);
      }, 1000);
    }
  };

  const getColorClass = (color) => {
    const baseClass = `w-24 h-24 md:w-32 md:h-32 cursor-pointer transition-all duration-200 border-4 `;
    const isActive = activeColor === color;
    
    switch (color) {
      case 'red': return baseClass + (isActive ? 'bg-red-600 border-red-800' : 'bg-red-400 border-red-600 hover:bg-red-500');
      case 'blue': return baseClass + (isActive ? 'bg-blue-600 border-blue-800' : 'bg-blue-400 border-blue-600 hover:bg-blue-500');
      case 'green': return baseClass + (isActive ? 'bg-green-600 border-green-800' : 'bg-green-400 border-green-600 hover:bg-green-500');
      case 'yellow': return baseClass + (isActive ? 'bg-yellow-600 border-yellow-800' : 'bg-yellow-400 border-yellow-600 hover:bg-yellow-500');
      default: return baseClass + 'bg-gray-400 border-gray-600';
    }
  };

  return (
    <div className="bg-white text-black p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 hover:bg-gray-100 p-2">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">BACK</span>
        </button>
        <div className="border-2 border-black p-3 bg-white">
          <div className="flex items-center space-x-2 mb-1">
            <Volume2 className="w-4 h-4" />
            <span className="font-black text-sm">SCORE</span>
          </div>
          <div className="text-xl font-black font-mono">{score}</div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-2xl font-black mb-2">SIMON SAYS</h3>
        <div className="w-16 h-1 bg-black mx-auto mb-4"></div>
        <p className="text-gray-600">Watch the sequence, then repeat it!</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {colors.map(color => (
            <div
              key={color}
              className={getColorClass(color)}
              onClick={() => handleColorClick(color)}
            />
          ))}
        </div>

        <div className="text-center">
          {gameStatus === 'ready' && (
            <button
              onClick={startGame}
              className="bg-black text-white px-8 py-4 font-black text-lg hover:bg-gray-800"
            >
              START GAME
            </button>
          )}

          {gameStatus === 'playing' && (
            <div className="space-y-2">
              <p className="font-bold">
                {isShowing ? 'WATCH THE SEQUENCE' : `REPEAT THE SEQUENCE (${playerSequence.length}/${sequence.length})`}
              </p>
              <div className="flex justify-center">
                {isShowing ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </div>
            </div>
          )}

          {gameStatus === 'game-over' && (
            <div className="space-y-4">
              <div className="bg-black text-white p-4">
                <p className="text-xl font-black">GAME OVER!</p>
                <p>Final Score: {score}</p>
              </div>
              <button
                onClick={startGame}
                className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800"
              >
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// === NUMBER SEQUENCE GAME ===
const NumberSequenceGame = ({ onBack, updateScore }) => {
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(3);
  const [gameStatus, setGameStatus] = useState('ready');
  const [showSequence, setShowSequence] = useState(false);

  const generateSequence = (length) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
  };

  const startRound = () => {
    const newSequence = generateSequence(level);
    setSequence(newSequence);
    setUserInput('');
    setGameStatus('showing');
    setShowSequence(true);

    setTimeout(() => {
      setShowSequence(false);
      setGameStatus('input');
    }, level * 1000 + 1000);
  };

  const checkAnswer = () => {
    const userNumbers = userInput.split('').map(Number);
    const isCorrect = userNumbers.length === sequence.length && 
                     userNumbers.every((num, index) => num === sequence[index]);

    if (isCorrect) {
      const newScore = score + level * 10;
      setScore(newScore);
      setLevel(prev => Math.min(prev + 1, 8));
      setGameStatus('correct');
      
      setTimeout(() => {
        startRound();
      }, 2000);
    } else {
      setGameStatus('wrong');
      updateScore(score);
    }
  };

  const startGame = () => {
    setScore(0);
    setLevel(3);
    setGameStatus('ready');
    startRound();
  };

  return (
    <div className="bg-white text-black p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 hover:bg-gray-100 p-2">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">BACK</span>
        </button>
        <div className="flex gap-4">
          <div className="border-2 border-black p-3 bg-white">
            <div className="flex items-center space-x-2 mb-1">
              <Hash className="w-4 h-4" />
              <span className="font-black text-sm">LEVEL</span>
            </div>
            <div className="text-xl font-black font-mono">{level}</div>
          </div>
          <div className="border-2 border-black p-3 bg-white">
            <div className="flex items-center space-x-2 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="font-black text-sm">SCORE</span>
            </div>
            <div className="text-xl font-black font-mono">{score}</div>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-2xl font-black mb-2">NUMBER SEQUENCE</h3>
        <div className="w-16 h-1 bg-black mx-auto mb-4"></div>
        <p className="text-gray-600">Memorize the number sequence and type it back!</p>
      </div>

      <div className="max-w-md mx-auto text-center">
        {gameStatus === 'ready' && (
          <button
            onClick={startGame}
            className="bg-black text-white px-8 py-4 font-black text-lg hover:bg-gray-800"
          >
            START GAME
          </button>
        )}

        {gameStatus === 'showing' && (
          <div className="space-y-6">
            <p className="text-lg font-bold">MEMORIZE THIS SEQUENCE:</p>
            <div className="bg-black text-white p-6 text-4xl font-mono tracking-wider">
              {showSequence ? sequence.join(' ') : ''}
            </div>
          </div>
        )}

        {gameStatus === 'input' && (
          <div className="space-y-6">
            <p className="text-lg font-bold">ENTER THE SEQUENCE:</p>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, '').slice(0, level))}
              className="w-full p-4 text-2xl text-center font-mono border-2 border-black"
              placeholder="Type numbers..."
              autoFocus
            />
            <button
              onClick={checkAnswer}
              disabled={userInput.length !== level}
              className="bg-black text-white px-8 py-3 font-black disabled:bg-gray-400"
            >
              CHECK ANSWER
            </button>
          </div>
        )}

        {gameStatus === 'correct' && (
          <div className="bg-green-100 border-2 border-green-400 p-6">
            <p className="text-xl font-black text-green-800">CORRECT! +{level * 10} points</p>
            <p className="text-green-600">Next level loading...</p>
          </div>
        )}

        {gameStatus === 'wrong' && (
          <div className="space-y-4">
            <div className="bg-red-100 border-2 border-red-400 p-6">
              <p className="text-xl font-black text-red-800">WRONG!</p>
              <p className="text-red-600">The sequence was: {sequence.join(' ')}</p>
              <p className="text-red-600">Final Score: {score}</p>
            </div>
            <button
              onClick={startGame}
              className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// === WHAT'S MISSING GAME ===
const WhatsMissingGame = ({ onBack, updateScore }) => {
  const allEmojis = ['🍎', '🚗', '🏠', '⭐', '🎈', '🌸', '🦋', '🎯', '🎭', '🎨', '⚽', '🎪'];
  const [currentItems, setCurrentItems] = useState([]);
  const [missingItem, setMissingItem] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameStatus, setGameStatus] = useState('ready');
  const [showItems, setShowItems] = useState(true);

  const startRound = () => {
    const numItems = Math.min(4 + round, 8);
    const selectedItems = shuffle(allEmojis).slice(0, numItems);
    const missing = selectedItems[Math.floor(Math.random() * selectedItems.length)];
    
    setCurrentItems(selectedItems);
    setMissingItem(missing);
    setUserAnswer('');
    setGameStatus('showing');
    setShowItems(true);

    setTimeout(() => {
      setShowItems(false);
      setGameStatus('guessing');
    }, 3000 + numItems * 200);
  };

  const checkAnswer = () => {
    const isCorrect = userAnswer === missingItem;
    
    if (isCorrect) {
      const newScore = score + round * 20;
      setScore(newScore);
      setRound(prev => prev + 1);
      setGameStatus('correct');
      
      setTimeout(() => {
        startRound();
      }, 2000);
    } else {
      setGameStatus('wrong');
      updateScore(score);
    }
  };

  const startGame = () => {
    setScore(0);
    setRound(1);
    startRound();
  };

  const itemsToShow = showItems ? currentItems : currentItems.filter(item => item !== missingItem);

  return (
    <div className="bg-white text-black p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 hover:bg-gray-100 p-2">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">BACK</span>
        </button>
        <div className="flex gap-4">
          <div className="border-2 border-black p-3 bg-white">
            <div className="flex items-center space-x-2 mb-1">
              <Eye className="w-4 h-4" />
              <span className="font-black text-sm">ROUND</span>
            </div>
            <div className="text-xl font-black font-mono">{round}</div>
          </div>
          <div className="border-2 border-black p-3 bg-white">
            <div className="flex items-center space-x-2 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="font-black text-sm">SCORE</span>
            </div>
            <div className="text-xl font-black font-mono">{score}</div>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-2xl font-black mb-2">WHAT'S MISSING?</h3>
        <div className="w-16 h-1 bg-black mx-auto mb-4"></div>
        <p className="text-gray-600">Memorize the items, then find what's missing!</p>
      </div>

      <div className="max-w-lg mx-auto">
        {gameStatus === 'ready' && (
          <div className="text-center">
            <button
              onClick={startGame}
              className="bg-black text-white px-8 py-4 font-black text-lg hover:bg-gray-800"
            >
              START GAME
            </button>
          </div>
        )}

        {(gameStatus === 'showing' || gameStatus === 'guessing') && (
          <div className="space-y-6">
            <p className="text-lg font-bold text-center">
              {gameStatus === 'showing' ? 'MEMORIZE THESE ITEMS:' : 'WHAT\'S MISSING?'}
            </p>
            
            <div className="grid grid-cols-4 gap-4 p-6 border-4 border-black bg-gray-50">
              {itemsToShow.map((item, index) => (
                <div key={index} className="text-4xl text-center p-2 bg-white border border-gray-300">
                  {item}
                </div>
              ))}
            </div>

            {gameStatus === 'guessing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {allEmojis.slice(0, 8).map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setUserAnswer(emoji)}
                      className={`text-2xl p-3 border-2 transition-colors ${
                        userAnswer === emoji 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white border-gray-300 hover:border-black'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <button
                    onClick={checkAnswer}
                    disabled={!userAnswer}
                    className="bg-black text-white px-8 py-3 font-black disabled:bg-gray-400"
                  >
                    SUBMIT ANSWER
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {gameStatus === 'correct' && (
          <div className="bg-green-100 border-2 border-green-400 p-6 text-center">
            <p className="text-xl font-black text-green-800">CORRECT! +{round * 20} points</p>
            <p className="text-green-600">Next round loading...</p>
          </div>
        )}

        {gameStatus === 'wrong' && (
          <div className="space-y-4">
            <div className="bg-red-100 border-2 border-red-400 p-6 text-center">
              <p className="text-xl font-black text-red-800">WRONG!</p>
              <p className="text-red-600">The missing item was: {missingItem}</p>
              <p className="text-red-600">Final Score: {score}</p>
            </div>
            <div className="text-center">
              <button
                onClick={startGame}
                className="bg-black text-white px-6 py-3 font-black hover:bg-gray-800"
              >
                TRY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// === MAIN GAME CENTER COMPONENT ===
const MemoryGameCenter = () => {
  const [currentGame, setCurrentGame] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [gameStats, setGameStats] = useState({
    memoryMatch: { played: 0, bestScore: 0 },
    simonSays: { played: 0, bestScore: 0 },
    numberSequence: { played: 0, bestScore: 0 },
    whatsMissing: { played: 0, bestScore: 0 }
  });

  const updateScore = (score) => {
    setTotalScore(prev => prev + score);
  };

  const games = [
    {
      id: 'memoryMatch',
      title: 'MEMORY MATCH',
      description: 'Find matching pairs to improve visual memory and concentration',
      icon: Brain,
      component: MemoryMatchGame,
      color: 'bg-gray-100'
    },
    {
      id: 'simonSays',
      title: 'SIMON SAYS',
      description: 'Follow the sequence patterns to boost working memory',
      icon: Volume2,
      component: SimonSaysGame,
      color: 'bg-gray-100'
    },
    {
      id: 'numberSequence',
      title: 'NUMBER SEQUENCE',
      description: 'Memorize and recall number patterns for cognitive training',
      icon: Hash,
      component: NumberSequenceGame,
      color: 'bg-gray-100'
    },
    {
      id: 'whatsMissing',
      title: 'WHAT\'S MISSING?',
      description: 'Identify missing items to strengthen observation skills',
      icon: Eye,
      component: WhatsMissingGame,
      color: 'bg-gray-100'
    }
  ];

  if (currentGame) {
    const GameComponent = currentGame.component;
    return <GameComponent onBack={() => setCurrentGame(null)} updateScore={updateScore} />;
  }

  return (
    <div className="bg-white text-black min-h-screen">
      {/* Header */}
      <div className="bg-black text-white p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ 
                fontFamily: '"Helvetica Neue", "Arial Black", sans-serif' 
              }}>
                BRAIN TRAINING CENTER
              </h1>
              <div className="w-16 h-1 bg-white mb-2"></div>
              <p className="text-lg">Boost memory, focus & cognitive skills through play</p>
            </div>
            <div className="text-right">
              <div className="border-2 border-white p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Star className="w-5 h-5" />
                  <span className="font-black">TOTAL SCORE</span>
                </div>
                <div className="text-2xl font-black font-mono">{totalScore}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {games.map(game => {
              const IconComponent = game.icon;
              return (
                <div 
                  key={game.id}
                  onClick={() => setCurrentGame(game)}
                  className="border-4 border-black p-8 cursor-pointer transition-all duration-300 hover:bg-black hover:text-white group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <IconComponent className="w-12 h-12" />
                    <div className="text-right">
                      <div className="text-sm font-bold opacity-60">BEST</div>
                      <div className="text-xl font-black font-mono">
                        {gameStats[game.id].bestScore}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black mb-3">{game.title}</h3>
                  <p className="text-sm leading-relaxed mb-4 opacity-80">
                    {game.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold opacity-60">
                      PLAYED: {gameStats[game.id].played}
                    </span>
                    <div className="text-sm font-black group-hover:underline">
                      PLAY NOW →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="mt-12 p-8 border-4 border-gray-300">
            <h2 className="text-2xl font-black mb-6 text-center">COGNITIVE BENEFITS</h2>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6" />
                </div>
                <h4 className="font-black mb-2">MEMORY</h4>
                <p className="text-sm text-gray-600">Enhance working & long-term memory</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-3">
                  <Eye className="w-6 h-6" />
                </div>
                <h4 className="font-black mb-2">ATTENTION</h4>
                <p className="text-sm text-gray-600">Improve focus & concentration span</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="font-black mb-2">PROCESSING</h4>
                <p className="text-sm text-gray-600">Boost cognitive processing speed</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6" />
                </div>
                <h4 className="font-black mb-2">SKILLS</h4>
                <p className="text-sm text-gray-600">Develop problem-solving abilities</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryGameCenter;
