import {OpenQuestion} from "@/game/types";

const botanique: OpenQuestion[] = [
    {
        id: "botanique-001",
        theme: "Botanique",
        statement: "Comment nomme-t-on la partie femelle de la fleur, qui regroupe le pistil et l'ovaire ?",
        answer: "gynécée",
    },
    {
        id: "botanique-002",
        theme: "Botanique",
        statement: "Quel est le nom du processus par lequel les plantes convertissent la lumière en énergie ?",
        answer: "photosynthèse",
    },
    {
        id: "botanique-003",
        theme: "Botanique",
        statement: "Comment appelle-t-on l'étude scientifique des végétaux ?",
        answer: "botanique",
    },
    {
        id: "botanique-004",
        theme: "Botanique",
        statement: "Quel organe de la plante absorbe l'eau et les minéraux du sol ?",
        answer: "racine",
        acceptableAnswers: ["racines", "les racines"],
    },
    {
        id: "botanique-005",
        theme: "Botanique",
        statement: "Comment nomme-t-on le grain reproducteur mâle produit par les fleurs ?",
        answer: "pollen",
    },
    {
        id: "botanique-006",
        theme: "Botanique",
        statement: "Quel est le nom de la graine dure contenue au cœur du fruit de l'olivier ou de la pêche ?",
        answer: "noyau",
    },
    {
        id: "botanique-007",
        theme: "Botanique",
        statement: "Comment appelle-t-on une plante qui vit plus de deux ans et refleurit chaque année ?",
        answer: "vivace",
        acceptableAnswers: ["plante vivace"],
    },
    {
        id: "botanique-008",
        theme: "Botanique",
        statement: "Quel pigment vert donne leur couleur aux feuilles et capte la lumière du soleil ?",
        answer: "chlorophylle",
    },
    {
        id: "botanique-009",
        theme: "Botanique",
        statement: "Comment nomme-t-on la transformation de la fleur en fruit après la fécondation ?",
        answer: "fructification",
    },
    {
        id: "botanique-010",
        theme: "Botanique",
        statement: "Quel est le nom du tissu qui transporte la sève brute des racines vers les feuilles ?",
        answer: "xylème",
    },
    {
        id: "botanique-011",
        theme: "Botanique",
        statement: "Comment appelle-t-on une plante qui germe, fleurit et meurt en une seule saison ?",
        answer: "annuelle",
        acceptableAnswers: ["plante annuelle"],
    },
    {
        id: "botanique-012",
        theme: "Botanique",
        statement: "Comment qualifie-t-on un arbre qui perd toutes ses feuilles en hiver ?",
        answer: "caduc",
        acceptableAnswers: ["arbre caduc"],
    },
];

export default botanique;
