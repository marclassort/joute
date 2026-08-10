import {Question} from "@/game/types";

const musique: Question[] = [
    {
        id: "mus-001",
        category: "musique",
        difficulty: 2,
        statement: "Quel compositeur allemand était presque totalement sourd en achevant sa Neuvième Symphonie ?",
        choices: ["Johann Sebastian Bach", "Wolfgang Amadeus Mozart", "Johannes Brahms", "Ludwig van Beethoven"],
        correctIndex: 3,
        explanation: "Beethoven avait perdu presque toute son audition lorsqu'il a achevé sa Neuvième Symphonie en 1824.",
        perishable: false,
    },
    {
        id: "mus-002",
        category: "musique",
        difficulty: 1,
        statement: "Quel groupe britannique a interprété la chanson « Hey Jude » ?",
        choices: ["The Beatles", "The Rolling Stones", "Pink Floyd", "Queen"],
        correctIndex: 0,
        explanation: "« Hey Jude » a été écrite par Paul McCartney et publiée par les Beatles en 1968.",
        perishable: false,
    },
    {
        id: "mus-003",
        category: "musique",
        difficulty: 2,
        statement: "Quel instrument de musique possède généralement 88 touches ?",
        choices: ["L'orgue", "Le piano", "L'accordéon", "Le clavecin"],
        correctIndex: 1,
        explanation: "Un piano standard compte 52 touches blanches et 36 touches noires, soit 88 au total.",
        perishable: false,
    },
];

export default musique;
