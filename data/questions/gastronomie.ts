import {Question} from "@/game/types";

const gastronomie: Question[] = [
    {
        id: "gastro-001",
        category: "gastronomie",
        difficulty: 1,
        statement: "De quel pays est originaire la pizza margherita ?",
        choices: ["La France", "L'Espagne", "L'Italie", "La Grèce"],
        correctIndex: 2,
        explanation: "La pizza margherita est née à Naples et aurait été créée en 1889 en l'honneur de la reine Marguerite de Savoie.",
        perishable: false,
    },
    {
        id: "gastro-002",
        category: "gastronomie",
        difficulty: 1,
        statement: "Quel ingrédient principal compose le guacamole ?",
        choices: ["La tomate", "Le maïs", "Le haricot rouge", "L'avocat"],
        correctIndex: 3,
        explanation: "Le guacamole est une préparation mexicaine à base d'avocat écrasé.",
        perishable: false,
    },
    {
        id: "gastro-003",
        category: "gastronomie",
        difficulty: 2,
        statement: "Quel fromage français porte le même nom qu'un village de Normandie ?",
        choices: ["Le camembert", "Le roquefort", "Le comté", "Le brie"],
        correctIndex: 0,
        explanation: "Le camembert tire son nom du village de Camembert, dans l'Orne, en Normandie.",
        perishable: false,
    },
];

export default gastronomie;
