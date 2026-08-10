import {Question} from "@/game/types";

const langue: Question[] = [
    {
        id: "lang-001",
        category: "langue",
        difficulty: 1,
        statement: "Combien de lettres compte l'alphabet français ?",
        choices: ["24", "26", "28", "25"],
        correctIndex: 1,
        explanation: "L'alphabet français utilise les 26 lettres de l'alphabet latin, de A à Z.",
        perishable: false,
    },
    {
        id: "lang-002",
        category: "langue",
        difficulty: 2,
        statement: "Quelle langue est officiellement parlée dans la majorité des pays d'Amérique du Sud ?",
        choices: ["Le portugais", "Le français", "L'espagnol", "L'anglais"],
        correctIndex: 2,
        explanation: "L'espagnol est langue officielle dans la plupart des pays sud-américains, à l'exception notable du Brésil, où l'on parle portugais.",
        perishable: false,
    },
    {
        id: "lang-003",
        category: "langue",
        difficulty: 2,
        statement: "Comment appelle-t-on un mot qui se lit de la même façon dans les deux sens, comme « radar » ?",
        choices: ["Un anagramme", "Un acronyme", "Un homonyme", "Un palindrome"],
        correctIndex: 3,
        explanation: "« Radar » et « kayak » sont des exemples classiques de palindromes.",
        perishable: false,
    },
];

export default langue;
