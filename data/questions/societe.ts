import {Question} from "@/game/types";

const societe: Question[] = [
    {
        id: "soc-001",
        category: "societe",
        difficulty: 2,
        statement: "En quelle année les femmes ont-elles obtenu le droit de vote en France ?",
        choices: ["1944", "1918", "1936", "1962"],
        correctIndex: 0,
        explanation: "Les Françaises ont voté pour la première fois lors des élections municipales de 1945, le droit ayant été accordé en 1944.",
        perishable: false,
    },
    {
        id: "soc-002",
        category: "societe",
        difficulty: 2,
        statement: "Quel document fondateur proclame des droits universels, adopté par l'ONU en 1948 ?",
        choices: ["La Charte des Nations unies", "La Déclaration universelle des droits de l'homme", "La Convention de Genève", "Le Pacte international"],
        correctIndex: 1,
        explanation: "Adoptée le 10 décembre 1948 à Paris, elle énonce les droits fondamentaux de tout être humain.",
        perishable: false,
    },
    {
        id: "soc-003",
        category: "societe",
        difficulty: 1,
        statement: "Quel âge minimum légal faut-il généralement avoir pour voter en France ?",
        choices: ["16 ans", "21 ans", "18 ans", "20 ans"],
        correctIndex: 2,
        explanation: "La majorité électorale a été abaissée de 21 à 18 ans en France en 1974.",
        perishable: false,
    },
];

export default societe;
