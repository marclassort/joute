import {Question} from "@/game/types";

const nature: Question[] = [
    {
        id: "nat-001",
        category: "nature",
        difficulty: 1,
        statement: "Quel est le plus grand mammifère du monde ?",
        choices: ["L'éléphant d'Afrique", "La baleine bleue", "Le rorqual commun", "Le cachalot"],
        correctIndex: 1,
        explanation: "La baleine bleue peut atteindre environ 30 mètres de long, ce qui en fait le plus grand animal jamais recensé.",
        perishable: false,
    },
    {
        id: "nat-002",
        category: "nature",
        difficulty: 1,
        statement: "Quel animal est le plus rapide sur terre sur de courtes distances ?",
        choices: ["Le lion", "L'antilope", "Le guépard", "Le léopard"],
        correctIndex: 2,
        explanation: "Le guépard peut atteindre environ 110 km/h en pointe sur de courtes distances.",
        perishable: false,
    },
    {
        id: "nat-003",
        category: "nature",
        difficulty: 2,
        statement: "Quelle est la plus grande forêt tropicale du monde ?",
        choices: ["La forêt du bassin du Congo", "La forêt de Bornéo", "La forêt de Sumatra", "La forêt amazonienne"],
        correctIndex: 3,
        explanation: "La forêt amazonienne s'étend sur environ 5,5 millions de km², principalement au Brésil.",
        perishable: false,
    },
];

export default nature;
