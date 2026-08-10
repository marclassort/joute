import {Question} from "@/game/types";

const arts: Question[] = [
    {
        id: "art-001",
        category: "arts",
        difficulty: 1,
        statement: "Qui a peint La Joconde ?",
        choices: ["Léonard de Vinci", "Michel-Ange", "Raphaël", "Botticelli"],
        correctIndex: 0,
        explanation: "Léonard de Vinci l'a peinte au début du XVIᵉ siècle ; elle est exposée au musée du Louvre.",
        perishable: false,
    },
    {
        id: "art-002",
        category: "arts",
        difficulty: 1,
        statement: "Dans quelle ville se trouve le musée du Louvre ?",
        choices: ["Lyon", "Paris", "Marseille", "Bruxelles"],
        correctIndex: 1,
        explanation: "Le Louvre, à Paris, est l'un des musées les plus visités au monde.",
        perishable: false,
    },
    {
        id: "art-003",
        category: "arts",
        difficulty: 2,
        statement: "Quel mouvement artistique est associé à Claude Monet ?",
        choices: ["Le cubisme", "Le surréalisme", "L'impressionnisme", "Le fauvisme"],
        correctIndex: 2,
        explanation: "Le tableau de Monet Impression, soleil levant a donné son nom au mouvement impressionniste.",
        perishable: false,
    },
];

export default arts;
