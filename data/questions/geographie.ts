import {Question} from "@/game/types";

const geographie: Question[] = [
    {
        id: "geo-001",
        category: "geographie",
        difficulty: 2,
        statement: "Quelle est la capitale de l'Australie ?",
        choices: ["Sydney", "Melbourne", "Perth", "Canberra"],
        correctIndex: 3,
        explanation: "Canberra a été choisie comme capitale en 1908, un compromis entre les rivales Sydney et Melbourne.",
        perishable: false,
    },
    {
        id: "geo-002",
        category: "geographie",
        difficulty: 1,
        statement: "Quel est le plus grand désert chaud du monde ?",
        choices: ["Le Sahara", "Le désert de Gobi", "Le désert du Kalahari", "Le désert d'Atacama"],
        correctIndex: 0,
        explanation: "Le Sahara couvre environ 9 millions de km², soit presque la superficie des États-Unis.",
        perishable: false,
    },
    {
        id: "geo-003",
        category: "geographie",
        difficulty: 2,
        statement: "Quel pays est traversé par l'équateur et porte son nom ?",
        choices: ["Le Kenya", "L'Équateur", "Le Brésil", "L'Indonésie"],
        correctIndex: 1,
        explanation: "L'Équateur, en Amérique du Sud, tire directement son nom de la ligne équatoriale qui le traverse.",
        perishable: false,
    },
];

export default geographie;
