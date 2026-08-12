/** Minuscules, sans accents, ponctuation retirée, espaces normalisés — pour comparer deux réponses sans être piégé par la casse ou les accents. */
export function normalizeAnswer(text: string): string {
    return text
        .normalize("NFD")
        .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function levenshteinDistance(a: string, b: string): number {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const distances = Array.from({length: rows}, (_, i) => {
        const row = new Array<number>(cols).fill(0);
        row[0] = i;
        return row;
    });
    for (let j = 0; j < cols; j += 1) distances[0][j] = j;

    for (let i = 1; i < rows; i += 1) {
        for (let j = 1; j < cols; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            distances[i][j] = Math.min(distances[i - 1][j] + 1, distances[i][j - 1] + 1, distances[i - 1][j - 1] + cost);
        }
    }
    return distances[rows - 1][cols - 1];
}

/**
 * Compare une réponse libre à la réponse attendue en tolérant les fautes de frappe légères :
 * jusqu'à ~20 % de la longueur du mot en distance d'édition (minimum 1 caractère), après
 * normalisation (casse, accents, ponctuation). Une saisie vide n'est jamais acceptée.
 */
export function isAnswerCorrect(userInput: string, expected: string): boolean {
    const normalizedInput = normalizeAnswer(userInput);
    const normalizedExpected = normalizeAnswer(expected);
    if (normalizedInput.length === 0) return false;
    if (normalizedInput === normalizedExpected) return true;

    const tolerance = Math.max(1, Math.floor(normalizedExpected.length * 0.2));
    return levenshteinDistance(normalizedInput, normalizedExpected) <= tolerance;
}
