import {Question} from "@/game/types";

const histoire: Question[] = [
    {
        id: "histoire-001",
        category: "histoire",
        difficulty: 1,
        statement: "En quelle année la Révolution française a-t-elle commencé ?",
        choices: ["1789", "1799", "1804", "1815"],
        correctIndex: 0,
        explanation: "La prise de la Bastille, le 14 juillet 1789, marque le début de la Révolution française.",
        perishable: false,
    },
    {
        id: "histoire-002",
        category: "histoire",
        difficulty: 2,
        statement: "Quel empereur français a été vaincu à la bataille de Waterloo ?",
        choices: ["Louis XVI", "Napoléon Bonaparte", "Charlemagne", "Napoléon III"],
        correctIndex: 1,
        explanation: "Napoléon Bonaparte y est définitivement défait le 18 juin 1815, marquant la fin du Premier Empire.",
        perishable: false,
    },
    {
        id: "histoire-003",
        category: "histoire",
        difficulty: 2,
        statement: "Quel mur a séparé Berlin-Est et Berlin-Ouest de 1961 à 1989 ?",
        choices: ["Le mur d'Hadrien", "La ligne Maginot", "Le mur de Berlin", "Le rideau de fer"],
        correctIndex: 2,
        explanation: "Le mur de Berlin a été construit en 1961 et sa chute, le 9 novembre 1989, a symbolisé la fin de la guerre froide.",
        perishable: false,
    },
];

export default histoire;
