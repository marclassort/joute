const ADJECTIVES = ["Vif", "Malin", "Curieux", "Rapide", "Sage", "Espiègle", "Futé", "Zen"];
const ANIMALS = ["Renard", "Panda", "Hibou", "Loutre", "Lynx", "Corbeau", "Faucon", "Koala"];

function randomFrom<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)];
}

/** Pseudo amusant du style "Renard-Vif-42", pré-rempli à l'inscription — modifiable ou gardé tel quel. */
export function generateNickname(): string {
    const number = Math.floor(Math.random() * 90) + 10;
    return `${randomFrom(ANIMALS)}-${randomFrom(ADJECTIVES)}-${number}`;
}

/** 4 suggestions distinctes du pseudo courant, pour l'écran "On t'a choisi un pseudo". */
export function generateNicknameSuggestions(count = 4): string[] {
    const suggestions = new Set<string>();
    while (suggestions.size < count) {
        suggestions.add(generateNickname());
    }
    return Array.from(suggestions);
}
