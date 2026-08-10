import {Question} from "@/game/types";

const culturePop: Question[] = [
    {
        id: "pop-001",
        category: "culture-pop",
        difficulty: 2,
        statement: "Quel réseau social était symbolisé par un petit oiseau bleu à son lancement ?",
        choices: ["Facebook", "Instagram", "Snapchat", "Twitter"],
        correctIndex: 3,
        explanation: "Twitter (rebaptisé X en 2023) utilisait un logo d'oiseau bleu depuis sa création en 2006.",
        perishable: false,
    },
    {
        id: "pop-002",
        category: "culture-pop",
        difficulty: 1,
        statement: "Comment s'appelle le personnage principal de la saga de jeux vidéo Super Mario, qui porte une casquette rouge ?",
        choices: ["Mario", "Luigi", "Yoshi", "Bowser"],
        correctIndex: 0,
        explanation: "Créé par Nintendo, Mario est apparu pour la première fois en 1981 dans le jeu Donkey Kong.",
        perishable: false,
    },
    {
        id: "pop-003",
        category: "culture-pop",
        difficulty: 1,
        statement: "Quelle entreprise a créé l'iPhone ?",
        choices: ["Samsung", "Apple", "Google", "Microsoft"],
        correctIndex: 1,
        explanation: "Le premier iPhone a été présenté par Steve Jobs en janvier 2007.",
        perishable: false,
    },
];

export default culturePop;
