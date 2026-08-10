import {Question} from "@/game/types";

const actualite: Question[] = [
    {
        id: "actu-001",
        category: "actualite",
        difficulty: 2,
        statement: "Quel est le nom donné aux Jeux olympiques d'hiver 2026, coorganisés par deux villes italiennes ?",
        choices: ["Torino Cortina 2026", "Roma Milano 2026", "Milano Cortina 2026", "Cortina Sestriere 2026"],
        correctIndex: 2,
        explanation:
            "Les Jeux se sont déroulés du 6 au 22 février 2026, coorganisés par Milan et Cortina d'Ampezzo, une première dans l'histoire olympique.",
        source: "https://fr.wikipedia.org/wiki/Jeux_olympiques_d'hiver_de_2026",
        perishable: true,
        validUntil: "2027-02-22T00:00:00.000Z",
    },
    {
        id: "actu-002",
        category: "actualite",
        difficulty: 2,
        statement: "Quel pays a remporté le Concours Eurovision de la chanson 2026 ?",
        choices: ["Israël", "La Finlande", "La Serbie", "La Bulgarie"],
        correctIndex: 3,
        explanation:
            "La Bulgarie a triomphé grâce à la chanson « Bangaranga » interprétée par Dara, décrochant sa toute première victoire dans l'histoire du concours.",
        source: "https://www.eurovision.com/stories/dara-wins-the-eurovision-song-contest-2026-for-bulgaria/",
        perishable: true,
        validUntil: "2027-05-17T00:00:00.000Z",
    },
    {
        id: "actu-003",
        category: "actualite",
        difficulty: 3,
        statement: "Qui a remporté l'élection présidentielle portugaise de février 2026 ?",
        choices: ["António José Seguro", "André Ventura", "Marcelo Rebelo de Sousa", "António Costa"],
        correctIndex: 0,
        explanation:
            "Le socialiste António José Seguro a été élu avec 66,8 % des voix face à André Ventura, lors d'un second tour, une première depuis 1986.",
        source: "https://www.robert-schuman.eu/fr/observatoire/6739-antonio-jose-seguro-elu-president-du-portugal",
        perishable: true,
        validUntil: "2027-02-08T00:00:00.000Z",
    },
];

export default actualite;
