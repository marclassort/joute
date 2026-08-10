import {Question} from "@/game/types";

const insolite: Question[] = [
    {
        id: "insolite-001",
        category: "insolite",
        difficulty: 2,
        statement: "Combien de cœurs possède une pieuvre ?",
        choices: ["1", "2", "4", "3"],
        correctIndex: 3,
        explanation: "Une pieuvre a trois cœurs : deux pompent le sang vers les branchies, un troisième vers le reste du corps.",
        perishable: false,
    },
    {
        id: "insolite-002",
        category: "insolite",
        difficulty: 3,
        statement: "Quel est le seul mammifère capable de voler activement, en battant des ailes, et non simplement de planer ?",
        choices: ["La chauve-souris", "L'écureuil volant", "Le colugo", "Le phalanger volant"],
        correctIndex: 0,
        explanation: "Contrairement aux écureuils ou colugos qui planent, la chauve-souris bat réellement des ailes pour voler.",
        perishable: false,
    },
    {
        id: "insolite-003",
        category: "insolite",
        difficulty: 2,
        statement: "Quelle partie du corps humain continue de pousser toute la vie, comme les cheveux ?",
        choices: ["Les dents", "Les ongles", "Les os", "Les yeux"],
        correctIndex: 1,
        explanation: "Les ongles, comme les cheveux, sont constitués de kératine et poussent en continu tout au long de la vie.",
        perishable: false,
    },
];

export default insolite;
