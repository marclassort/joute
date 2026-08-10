import {Question} from "@/game/types";

const sport: Question[] = [
    {
        id: "sport-001",
        category: "sport",
        difficulty: 1,
        statement: "Tous les combien d'années les Jeux olympiques d'été ont-ils lieu ?",
        choices: ["2 ans", "4 ans", "3 ans", "5 ans"],
        correctIndex: 1,
        explanation: "Le Comité international olympique organise les Jeux d'été tous les quatre ans, sauf exception.",
        perishable: false,
    },
    {
        id: "sport-002",
        category: "sport",
        difficulty: 1,
        statement: "Combien de joueurs une équipe de football aligne-t-elle sur le terrain ?",
        choices: ["10", "9", "11", "12"],
        correctIndex: 2,
        explanation: "Chaque équipe de football aligne 11 joueurs, dont un gardien de but.",
        perishable: false,
    },
    {
        id: "sport-003",
        category: "sport",
        difficulty: 1,
        statement: "Quel sport utilise un club et une petite balle blanche, avec pour objectif de l'envoyer dans un trou ?",
        choices: ["Le hockey sur gazon", "Le croquet", "Le bowling", "Le golf"],
        correctIndex: 3,
        explanation: "Au golf, le joueur cherche à envoyer la balle dans chacun des trous du parcours en un minimum de coups.",
        perishable: false,
    },
];

export default sport;
