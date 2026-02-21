
const STORAGE_KEY = 'geography_quiz_high_scores';

export const getHighScores = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const scores = data ? JSON.parse(data) : [];
        return scores.sort((a, b) => b.score - a.score).slice(0, 5);
    } catch (e) {
        console.error('Failed to load high scores', e);
        return [];
    }
};

export const saveHighScore = (name, score) => {
    const scores = getHighScores();
    const newEntry = {
        name,
        score,
        date: new Date().toISOString()
    };

    // Add new score
    scores.push(newEntry);

    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);

    // Keep top 5
    const top5 = scores.slice(0, 5);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(top5));
    } catch (e) {
        console.error('Failed to save high scores', e);
    }

    return top5;
};

export const isNewHighScore = (score) => {
    const scores = getHighScores();
    if (scores.length < 5) return true;
    // If full, must beat or tie the lowest score
    return score >= scores[scores.length - 1].score;
};
