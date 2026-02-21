
import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import Quiz from './components/Quiz';
import { Sparkles, GraduationCap } from 'lucide-react';
import { prefectures } from './data/prefectures';

function App() {
  const [selectedPrefecture, setSelectedPrefecture] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden text-gray-800 font-sans bg-slate-50">

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm z-20 px-6 py-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-lg shadow-md rotate-3 transform hover:rotate-6 transition-transform cursor-pointer" onClick={() => setSelectedPrefecture(null)}>
            <GraduationCap className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
              都道府県マスター
            </h1>
            <p className="text-xs text-gray-500 font-bold tracking-wide">中学受験完全対応版</p>
          </div>
        </div>

        <button
          onClick={() => setShowQuiz(true)}
          className="relative inline-flex items-center justify-center px-6 py-2 overflow-hidden font-bold text-white transition-all duration-300 bg-indigo-600 rounded-full hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg focus:outline-none"
        >
          <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
          <span className="relative flex items-center">
            <Sparkles className="mr-2 animate-pulse" size={18} />
            テストする
          </span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">

        {/* Map Area */}
        <div className={`transition-all duration-500 ease-spring ${selectedPrefecture ? 'w-full md:w-2/3 lg:w-3/4' : 'w-full'} h-full relative`}>
          <MapComponent onSelectPrefecture={setSelectedPrefecture} />
        </div>

        {/* Sidebar Area - Sliding Panel */}
        <div
          className={`fixed inset-y-0 right-0 z-10 w-full md:w-1/3 lg:w-1/4 bg-white/80 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-100 ${selectedPrefecture ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ top: '80px' }} // Approx header height
        >
          {selectedPrefecture && (
            <Sidebar
              prefecture={selectedPrefecture}
              onClose={() => setSelectedPrefecture(null)}
            />
          )}
        </div>

      </main>

      {/* Quiz Modal */}
      {showQuiz && (
        <Quiz
          prefectures={prefectures}
          onClose={() => setShowQuiz(false)}
        />
      )}

    </div>
  );
}

export default App;
