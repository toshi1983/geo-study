
import React from 'react';
import Japan from '@react-map/japan';
import { prefectures } from '../data/prefectures';

const MapComponent = ({ onSelectPrefecture }) => {
    const handleSelect = (code) => {
        // Normalize code (remove weird characters if any, lowercase)
        const cleanCode = code.replace(/[^\w]/g, '').toLowerCase();

        // Find prefecture in data
        const prefecture = prefectures.find(p => p.id === cleanCode || p.id === code.toLowerCase());

        if (prefecture) {
            onSelectPrefecture(prefecture);
        } else {
            console.warn("Prefecture not found for code:", code);
            // Fallback for special naming cases if any (e.g. Kyoto vs Kyoto-fu)
            // Our data ids are simple lowercase.
            // Try fuzzy match
            const fuzzy = prefectures.find(p => p.id.includes(cleanCode));
            if (fuzzy) onSelectPrefecture(fuzzy);
        }
    };

    return (
        <div className="w-full h-full flex justify-center items-center bg-blue-50 relative overflow-hidden p-4 rounded-xl shadow-inner">
            <div className="absolute top-4 left-4 text-blue-800 font-bold z-10 bg-white/80 p-2 rounded backdrop-blur">
                地図をクリックしてね！
            </div>
            <Japan
                type="select-single"
                size={600}
                mapColor="#86efac" // Light green
                strokeColor="#14532d" // Dark green
                strokeWidth={1}
                hoverColor="#fcd34d" // Yellow
                selectColor="#f87171" // Red
                onSelect={handleSelect}
                hints={true} // Show nametags
            />
        </div>
    );
};

export default MapComponent;
