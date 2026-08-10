import {Question} from "@/game/types";

const logique: Question[] = [
    {
        id: "log-001",
        category: "logique",
        difficulty: 1,
        statement: "Quel nombre suit logiquement la suite 2, 4, 8, 16, ... ?",
        choices: ["32", "24", "18", "20"],
        correctIndex: 0,
        explanation: "Chaque nombre est le double du précédent : 16 × 2 = 32.",
        perishable: false,
    },
    {
        id: "log-002",
        category: "logique",
        difficulty: 2,
        statement: "Si tous les chats sont des mammifères et que Félix est un chat, que peut-on affirmer avec certitude sur Félix ?",
        choices: ["Félix est un chien", "Félix est un mammifère", "Félix n'est pas un animal", "Félix est un reptile"],
        correctIndex: 1,
        explanation: "C'est un raisonnement déductif simple : appartenir à la catégorie « chat » implique d'appartenir à la catégorie « mammifère ».",
        perishable: false,
    },
    {
        id: "log-003",
        category: "logique",
        difficulty: 1,
        statement: "Combien de côtés possède un hexagone ?",
        choices: ["5", "8", "6", "7"],
        correctIndex: 2,
        explanation: "Le préfixe « hexa » signifie six en grec, d'où les six côtés de l'hexagone.",
        perishable: false,
    },
];

export default logique;
