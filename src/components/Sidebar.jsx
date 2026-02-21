
import React from 'react';
import { X, MapPin, Factory, Mountain, Wheat, FerrisWheel } from 'lucide-react';

const Sidebar = ({ prefecture, onClose }) => {
    if (!prefecture) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-white shadow-lg rounded-xl ml-4">
                <MapPin size={48} className="mb-4 opacity-50" />
                <p className="text-xl font-bold">地図の県をクリックして詳細を見てみよう！</p>
                <p className="mt-2 text-sm">中学受験に役立つ情報が表示されるよ。</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col bg-white shadow-xl rounded-l-xl overflow-hidden border-l border-gray-100 relative">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
            >
                <X size={20} />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10 transform -skew-x-12 translate-x-1/2"></div>
                <h2 className="text-4xl font-extrabold mb-1 relative z-10 drop-shadow-md">{prefecture.name}</h2>
                <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    {prefecture.region}地方
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Basic Info */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-200 p-2 rounded-full">
                            <FerrisWheel size={20} className="text-blue-700" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-500 font-bold uppercase">県庁所在地</p>
                            <p className="text-lg font-bold text-gray-800">{prefecture.capital}</p>
                        </div>
                    </div>
                </div>

                {/* Facts */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="w-1 h-6 bg-indigo-500 rounded-full mr-2"></span>
                        中学受験のポイント
                    </h3>
                    <ul className="space-y-3">
                        {prefecture.facts.map((fact, index) => (
                            <li key={index} className="flex items-start bg-gray-50 p-3 rounded-lg hover:bg-indigo-50 transition-colors border border-gray-100">
                                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                    {index + 1}
                                </span>
                                <span className="text-gray-700 text-sm leading-relaxed font-medium">{fact}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Resources / Products */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <div className="flex items-center mb-2 text-green-700 font-bold text-sm">
                            <Wheat size={16} className="mr-2" /> 特産品
                        </div>
                        <p className="text-gray-600 text-sm">{prefecture.products}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                        <div className="flex items-center mb-2 text-orange-700 font-bold text-sm">
                            <Mountain size={16} className="mr-2" /> 地形
                        </div>
                        <p className="text-gray-600 text-sm">{prefecture.terrain}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Sidebar;
