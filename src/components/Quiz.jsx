import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, RefreshCcw, BookOpen, Users, User, Zap, Lock, Save } from 'lucide-react';
import { getHighScores, saveHighScore, isNewHighScore } from '../services/db';

const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const Quiz = ({ prefectures, onClose }) => {
    // Game State
    const [gameState, setGameState] = useState('setup'); // setup, playing, result
    const [playerCount, setPlayerCount] = useState(1);

    // Quiz Data
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Gameplay State
    const [scores, setScores] = useState([0, 0, 0]);
    const [activePlayer, setActivePlayer] = useState(null); // Who is answering
    const [lockedPlayers, setLockedPlayers] = useState([]); // Who answered wrong for current Q
    const [penaltyPlayers, setPenaltyPlayers] = useState([]); // Who is penalized for NEXT Q
    const [isAnswered, setIsAnswered] = useState(false); // Processing answer
    const [feedback, setFeedback] = useState(null); // { type: 'correct'|'wrong', player: number }

    // High Score State
    const [leaderboard, setLeaderboard] = useState([]);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [playerNameInput, setPlayerNameInput] = useState('');
    const [hasSavedScore, setHasSavedScore] = useState(false);

    useEffect(() => {
        if (gameState === 'playing' && playerCount > 1) {
            const handleKeyDown = (e) => {
                // If answering, or already buzzed, or showing feedback, ignore
                if (activePlayer !== null || isAnswered || feedback) return;

                const key = e.key.toLowerCase();
                let buzzerPlayer = -1;

                if (key === 'a') buzzerPlayer = 0;
                if (key === 'g' && playerCount >= 2) buzzerPlayer = 1;
                if (key === 'l' && playerCount >= 3) buzzerPlayer = 2;

                if (buzzerPlayer !== -1 && !lockedPlayers.includes(buzzerPlayer)) {
                    setActivePlayer(buzzerPlayer);
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [gameState, playerCount, activePlayer, lockedPlayers, isAnswered, feedback]);

    const startGame = (count) => {
        setPlayerCount(count);
        setScores(new Array(3).fill(0));
        setLockedPlayers([]);
        setPenaltyPlayers([]);
        // For 1 player, they are always "active" (can answer immediately)
        setActivePlayer(count === 1 ? 0 : null);

        generateQuestions();
        setGameState('playing');
        setCurrentQuestionIndex(0);

        // Reset High Score State
        setIsNewRecord(false);
        setHasSavedScore(false);
        setPlayerNameInput('');
    };

    const generateQuestions = () => {
        const newQuestions = [];
        const usedFacts = new Set();
        let iterations = 0;

        // TEMPORARY CHANGE: 20 -> 3 for testing
        while (newQuestions.length < 20 && iterations < 2000) {
            iterations++;
            const type = Math.random();
            const correctPre = prefectures[Math.floor(Math.random() * prefectures.length)];
            let question = {};

            if (type < 0.6) {
                // Fact
                if (!correctPre.facts || correctPre.facts.length === 0) continue;
                const factIndex = Math.floor(Math.random() * correctPre.facts.length);
                const fact = correctPre.facts[factIndex];
                if (usedFacts.has(fact)) continue;
                usedFacts.add(fact);
                question = {
                    type: 'fact',
                    text: `「${fact}」\nこれ、どこの都道府県？`,
                    correctAnswer: correctPre.name,
                    correctPre: correctPre,
                    options: generateOptions(correctPre.name, prefectures.map(p => p.name))
                };
            } else if (type < 0.8) {
                // Capital
                const isDistinct = !correctPre.capital.includes(correctPre.name.replace(/[県府都]/, ''));
                if (isDistinct || Math.random() > 0.5) {
                    question = {
                        type: 'capital',
                        text: `${correctPre.name}の県庁所在地はどこ？`,
                        correctAnswer: correctPre.capital,
                        correctPre: correctPre,
                        options: generateOptions(correctPre.capital, prefectures.map(p => p.capital))
                    };
                } else continue;
            } else {
                // Product
                const items = (correctPre.products || "").split('・');
                if (items.length > 0 && items[0]) {
                    const item = items[Math.floor(Math.random() * items.length)];
                    question = {
                        type: 'product',
                        text: `「${item}」が特産（または有名）なのはどこ？`,
                        correctAnswer: correctPre.name,
                        correctPre: correctPre,
                        options: generateOptions(correctPre.name, prefectures.map(p => p.name))
                    };
                } else continue;
            }
            newQuestions.push(question);
        }
        setQuestions(newQuestions);
    };

    const generateOptions = (correct, allOptions) => {
        const distractors = shuffleArray(allOptions.filter(o => o !== correct)).slice(0, 3);
        return shuffleArray([correct, ...distractors]);
    };

    const handleAnswer = (answer) => {
        if (isAnswered) return;
        if (playerCount > 1 && activePlayer === null) return; // Must buzz first in MP

        setIsAnswered(true);
        const currentPlayer = activePlayer; // Capture current player
        const isCorrect = answer === questions[currentQuestionIndex].correctAnswer;

        if (isCorrect) {
            // Correct Logic
            setFeedback({ type: 'correct', player: currentPlayer });
            setScores(prev => {
                const newScores = [...prev];
                newScores[currentPlayer] = (newScores[currentPlayer] || 0) + 1;
                return newScores;
            });

            // Visuals
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: currentPlayer === 0 ? ['#3B82F6'] : currentPlayer === 1 ? ['#EF4444'] : ['#10B981']
            });

            setTimeout(() => {
                nextQuestion();
            }, 1500);

        } else {
            // Wrong Logic
            setFeedback({ type: 'wrong', player: currentPlayer });

            setTimeout(() => {
                if (playerCount === 1) {
                    // Single Player: Just move on (Standard Mode)
                    nextQuestion();
                } else {
                    // Multiplayer: Lock and Continue
                    setLockedPlayers(prev => [...prev, currentPlayer]); // Current Q Lock
                    setPenaltyPlayers(prev => [...prev, currentPlayer]); // Next Q Lock

                    setActivePlayer(null); // Reset buzzer
                    setFeedback(null);     // Remove overlay
                    setIsAnswered(false);  // Allow new buzzer

                    // Check if all players are now locked
                    if (lockedPlayers.length + 1 >= playerCount) {
                        // All players wrong -> Next Question
                        nextQuestion();
                    }
                }
            }, 1000);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);

            // Apply Penalties from previous round
            setLockedPlayers(penaltyPlayers);
            // Clear future penalties (they are now active locks)
            setPenaltyPlayers([]);

            setFeedback(null);
            setIsAnswered(false);

            // If SP, always active. If MP, wait for buzzer.
            setActivePlayer(playerCount === 1 ? 0 : null);

        } else {
            finishGame();
        }
    };

    const finishGame = () => {
        setGameState('result');
        // Final confetti
        // Use questions.length instead of 20 for logic, or just assume max score is questions.length
        const maxQ = questions.length;
        if (playerCount === 1 && scores[0] >= Math.ceil(maxQ * 0.75)) {
            confetti({ particleCount: 500, spread: 100, origin: { y: 0.6 } });
        } else if (playerCount > 1) {
            confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
        }
    };

    // Handle Game State Change to Result
    useEffect(() => {
        if (gameState === 'result' && playerCount === 1) {
            const finalScore = scores[0];
            setLeaderboard(getHighScores());

            if (isNewHighScore(finalScore)) {
                setIsNewRecord(true);
            }
        }
    }, [gameState]); // Refreshes when gameState changes to result

    const handleSaveScore = () => {
        if (!playerNameInput.trim()) return;
        saveHighScore(playerNameInput, scores[0]);
        setHasSavedScore(true);
        setIsNewRecord(false); // Hide input
        setLeaderboard(getHighScores()); // Refresh
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.7 } });
    };

    // --- RENDER ---

    if (gameState === 'setup') {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center"
                >
                    <h2 className="text-3xl font-black text-gray-800 mb-6">人数を選んでね</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3].map(num => (
                            <button
                                key={num}
                                onClick={() => startGame(num)}
                                className="group p-6 rounded-xl border-2 border-gray-100 hover:border-indigo-500 bg-gray-50 hover:bg-indigo-50 transition-all duration-300 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${num === 1 ? 'bg-blue-100 text-blue-600' : num === 2 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                        {num === 1 ? <User size={24} /> : <Users size={24} />}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xl font-bold text-gray-800">{num}人でテスト</div>
                                        <div className="text-sm text-gray-500">
                                            {num === 1 ? 'じっくり自分のペースで' : '早押し対戦モード！'}
                                        </div>
                                    </div>
                                </div>
                                <Zap className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                            </button>
                        ))}
                    </div>
                    {/* Controls Hints */}
                    <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600 text-left">
                        <p className="font-bold mb-2">対戦モードの操作 (早押しキー):</p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="font-bold text-blue-600 w-16">Player 1</span>
                                <span className="px-2 py-0.5 bg-white border border-gray-300 rounded font-mono shadow-sm">A</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="font-bold text-red-500 w-16">Player 2</span>
                                <span className="px-2 py-0.5 bg-white border border-gray-300 rounded font-mono shadow-sm">G</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="font-bold text-green-600 w-16">Player 3</span>
                                <span className="px-2 py-0.5 bg-white border border-gray-300 rounded font-mono shadow-sm">L</span>
                            </li>
                        </ul>
                    </div>
                    <button onClick={onClose} className="mt-6 text-gray-500 hover:text-gray-800 underline font-bold">キャンセル</button>
                </motion.div>
            </div>
        );
    }

    if (gameState === 'result') {
        const maxScore = Math.max(...scores.slice(0, playerCount));
        // Use actual question length for display
        const totalQ = questions.length;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center border-4 border-yellow-400 max-h-[90vh] overflow-y-auto"
                >
                    <Trophy size={64} className="mx-auto mb-4 text-yellow-500" />
                    <h2 className="text-3xl font-black text-gray-800 mb-6">結果発表！</h2>

                    {playerCount === 1 ? (
                        <div className="mb-8">
                            <p className="text-6xl font-black text-blue-600 mb-2">{scores[0]} <span className="text-2xl text-gray-400">/ {totalQ}</span></p>
                            {scores[0] === totalQ ?
                                <p className="text-red-500 font-bold text-xl">全問正解！キミは地理マスターだ！</p> :
                                scores[0] >= Math.ceil(totalQ * 0.75) ?
                                    <p className="text-orange-500 font-bold text-xl">すごい！あと少し！</p> :
                                    <p className="text-gray-600 font-bold text-xl">次こそ頑張ろう！</p>
                            }

                            {/* High Score Input Section */}
                            {isNewRecord && !hasSavedScore && (
                                <div className="mt-6 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                                    <p className="text-yellow-600 font-bold mb-2 flex items-center justify-center gap-2">
                                        <Zap size={16} /> ハイスコア達成！名前を入れてね
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={playerNameInput}
                                            onChange={(e) => setPlayerNameInput(e.target.value)}
                                            placeholder="名前"
                                            className="flex-1 p-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            maxLength={10}
                                        />
                                        <button
                                            onClick={handleSaveScore}
                                            disabled={!playerNameInput.trim()}
                                            className="bg-yellow-500 text-white p-2 rounded-lg font-bold shadow-sm hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save size={24} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Leaderboard Display */}
                            <div className="mt-6">
                                <h4 className="text-gray-500 font-bold text-sm mb-2 uppercase tracking-wide">ハイスコア (Top 5)</h4>
                                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden text-sm">
                                    {leaderboard.length > 0 ? (
                                        leaderboard.map((entry, idx) => (
                                            <div key={idx} className={`flex justify-between items-center p-3 border-b border-gray-100 last:border-0 ${entry.score === scores[0] && hasSavedScore && entry.name === playerNameInput ? 'bg-yellow-100' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-400 text-white shadow-sm' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'text-gray-400'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-bold text-gray-700">{entry.name}</span>
                                                </div>
                                                <span className="font-mono font-bold text-indigo-600">{entry.score} pt</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-gray-400 italic">まだ記録がありません</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-8 space-y-3">
                            {scores.slice(0, playerCount).map((score, idx) => {
                                const isWinner = score === maxScore;
                                return (
                                    <div key={idx} className={`flex justify-between items-center p-4 rounded-xl transition-all ${isWinner ? 'bg-yellow-50 border-2 border-yellow-400 transform scale-105 shadow-md' : 'bg-gray-50 border border-gray-100'}`}>
                                        <div className="flex items-center gap-3">
                                            {isWinner && <Trophy size={20} className="text-yellow-500" />}
                                            <span className={`font-bold text-lg ${idx === 0 ? 'text-blue-600' : idx === 1 ? 'text-red-500' : 'text-green-600'}`}>
                                                Player {idx + 1}
                                            </span>
                                        </div>
                                        <span className="text-3xl font-black text-gray-800">{score}pt</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex gap-4 justify-center">
                        <button onClick={onClose} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-full font-bold flex items-center">
                            <BookOpen size={20} className="mr-2" />
                            地図に戻る
                        </button>
                        <button onClick={() => startGame(playerCount)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold flex items-center shadow-lg transform active:scale-95 transition-all">
                            <RefreshCcw size={20} className="mr-2" />
                            もう一度
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // --- PLAYING STATE ---

    if (questions.length === 0) return null; // Loading
    const currentQ = questions[currentQuestionIndex];
    const currentActivePlayer = activePlayer;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                key={currentQuestionIndex}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full flex flex-col relative min-h-[500px]"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">
                        第 {currentQuestionIndex + 1} 問 / {questions.length}
                    </span>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
                </div>

                {/* Multiplayer Scores Header */}
                {playerCount > 1 && (
                    <div className="flex divide-x divide-gray-200 border-b">
                        {scores.slice(0, playerCount).map((s, idx) => {
                            const isActive = currentActivePlayer === idx;
                            const isLocked = lockedPlayers.includes(idx);

                            return (
                                <div key={idx} className={`flex-1 p-3 text-center transition-all duration-300 relative overflow-hidden ${isActive ? 'bg-indigo-50' : 'bg-white'} ${isLocked ? 'bg-red-50 opacity-60' : ''}`}>
                                    {isActive && <motion.div layoutId="active-indicator" className="absolute inset-x-0 top-0 h-1 bg-indigo-500" />}

                                    <div className={`text-xs font-bold uppercase mb-1 ${idx === 0 ? 'text-blue-500' : idx === 1 ? 'text-red-500' : 'text-green-500'}`}>
                                        Player {idx + 1}
                                    </div>
                                    <div className="text-3xl font-black text-slate-800 leading-none">{s}</div>

                                    {isActive && <div className="text-xs text-indigo-600 font-bold mt-1 animate-pulse">回答中...</div>}
                                    {isLocked && <div className="text-xs text-red-500 font-bold mt-1 flex items-center justify-center gap-1"><Lock size={10} /> 休み</div>}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Single Player Score */}
                {playerCount === 1 && (
                    <div className="absolute top-16 right-6 font-bold text-gray-400">Score: {scores[0]}</div>
                )}

                <div className="p-8 flex-1 flex flex-col">
                    {/* Question Text */}
                    <div className="mb-8 text-center">
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {currentQ.text}
                        </h3>

                        {/* Buzzer Prompt */}
                        {playerCount > 1 && currentActivePlayer === null && (
                            <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-pulse">
                                <p className="text-indigo-600 font-bold text-lg flex items-center justify-center gap-2">
                                    <Zap size={20} />
                                    早押しボタンを押して！
                                </p>
                                <div className="flex justify-center gap-4 mt-2 text-sm text-indigo-400 font-mono">
                                    <span className={lockedPlayers.includes(0) ? 'text-gray-300 line-through' : ''}>P1: [A]</span>
                                    <span className={lockedPlayers.includes(1) ? 'text-gray-300 line-through' : ''}>P2: [G]</span>
                                    {playerCount >= 3 && <span className={lockedPlayers.includes(2) ? 'text-gray-300 line-through' : ''}>P3: [L]</span>}
                                </div>
                            </div>
                        )}

                        {/* All players locked warning (if happens) */}
                        {playerCount > 1 && lockedPlayers.length >= playerCount && (
                            <div className="mt-4 text-red-500 font-bold">
                                全員不正解！次の問題へ...
                            </div>
                        )}
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-center relative">
                        {currentQ.options.map((option, idx) => {
                            // Visual States
                            const isDisabled = (playerCount > 1 && currentActivePlayer === null) || feedback !== null;

                            let btnClass = "bg-white border-2 border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 shadow-sm";

                            // Visual Logic for Feedback
                            if (feedback) {
                                if (feedback.type === 'correct' && option === currentQ.correctAnswer) {
                                    // ONLY Highlight Green if answer was correct
                                    btnClass = "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-200";
                                } else if (feedback.type === 'wrong') {
                                    // If wrong, dim/gray everything. DO NOT show green.
                                    btnClass = "opacity-40 grayscale";
                                } else if (feedback.type === 'correct') {
                                    // If correct (but not this option), dim this.
                                    btnClass = "opacity-30 grayscale";
                                }
                            } else if (isDisabled) {
                                btnClass = "opacity-50 grayscale cursor-not-allowed";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(option)}
                                    disabled={isDisabled || isAnswered}
                                    className={`p-4 rounded-xl text-lg font-bold transition-all duration-200 flex items-center justify-between group ${btnClass} ${!isDisabled ? 'transform hover:scale-[1.02] active:scale-95' : ''}`}
                                >
                                    <span>{option}</span>
                                    {feedback?.type === 'correct' && option === currentQ.correctAnswer && <CheckCircle className="text-green-600" />}
                                </button>
                            );
                        })}

                        {/* Wrong Feedback Overlay */}
                        <AnimatePresence>
                            {feedback?.type === 'wrong' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                                >
                                    <div className="bg-white rounded-full p-4 shadow-2xl">
                                        <XCircle className="text-red-500 w-32 h-32" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Quiz;
