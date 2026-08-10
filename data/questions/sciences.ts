import {Question} from "@/game/types";

const sciences: Question[] = [
    {
        id: "sci-001",
        category: "sciences",
        difficulty: 2,
        statement: "Quel est le symbole chimique de l'or ?",
        choices: ["Ag", "Or", "Au", "Fe"],
        correctIndex: 2,
        explanation: "Au vient du latin aurum, qui signifie « or ».",
        perishable: false,
    },
    {
        id: "sci-002",
        category: "sciences",
        difficulty: 1,
        statement: "Quelle planète est la plus proche du Soleil ?",
        choices: ["Vénus", "Mars", "la Terre", "Mercure"],
        correctIndex: 3,
        explanation: "Mercure orbite en moyenne à environ 58 millions de km du Soleil.",
        perishable: false,
    },
    {
        id: "sci-003",
        category: "sciences",
        difficulty: 2,
        statement: "Combien de chromosomes une cellule humaine typique possède-t-elle ?",
        choices: ["46", "44", "48", "23"],
        correctIndex: 0,
        explanation: "L'être humain possède 23 paires de chromosomes, soit 46 au total.",
        perishable: false,
    },
];

export default sciences;
