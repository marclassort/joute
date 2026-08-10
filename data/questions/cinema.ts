import {Question} from "@/game/types";

const cinema: Question[] = [
    {
        id: "cine-001",
        category: "cinema",
        difficulty: 1,
        statement: "Qui a réalisé le film Titanic (1997) ?",
        choices: ["Steven Spielberg", "Christopher Nolan", "James Cameron", "Ridley Scott"],
        correctIndex: 2,
        explanation: "James Cameron a aussi réalisé Avatar, sorti en 2009.",
        perishable: false,
    },
    {
        id: "cine-002",
        category: "cinema",
        difficulty: 1,
        statement: "Dans quelle saga de films apparaît le personnage de Dark Vador ?",
        choices: ["Star Trek", "Le Seigneur des Anneaux", "Dune", "Star Wars"],
        correctIndex: 3,
        explanation: "Dark Vador apparaît pour la première fois dans Un nouvel espoir, sorti en 1977.",
        perishable: false,
    },
    {
        id: "cine-003",
        category: "cinema",
        difficulty: 2,
        statement: "Quel studio d'animation a produit le film Toy Story ?",
        choices: ["Pixar", "DreamWorks", "Illumination", "Disney"],
        correctIndex: 0,
        explanation: "Sorti en 1995, Toy Story est le premier long métrage entièrement animé par ordinateur.",
        perishable: false,
    },
];

export default cinema;
