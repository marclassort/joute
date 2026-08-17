import {RiddleQuestion} from "@/game/types";

/**
 * Énigmes de La Joute : 4 indices révélés un par un, du plus vague au plus précis, plus 4 propositions
 * QCM pour le filet de secours (voir game/oneWinnerConfig.ts JOUTE_FILET_THRESHOLD). Premier lot de
 * démarrage, facilement enrichissable — même remarque que le corpus MCQ de data/questions/.
 */
const riddles: RiddleQuestion[] = [
    {
        id: "riddle-001",
        clues: [
            "Je suis un fleuve d'Asie long de plus de 6 000 km.",
            "Je prends ma source sur le plateau tibétain.",
            "Un barrage géant porte le nom de mes Trois Gorges.",
            "Je me jette dans la mer de Chine orientale, à Shanghai.",
        ],
        answer: "Yangtsé",
        choices: ["Le Mékong", "Le Yangtsé", "Le Gange", "L'Indus"],
        correctIndex: 1,
    },
    {
        id: "riddle-002",
        clues: [
            "Je suis la plus haute montagne du monde.",
            "Je culmine à plus de 8 800 mètres.",
            "Je me situe à la frontière entre le Népal et la Chine.",
            "Les sherpas m'appellent Chomolungma.",
        ],
        answer: "Everest",
        choices: ["Le K2", "Le Kilimandjaro", "L'Everest", "Le Mont Blanc"],
        correctIndex: 2,
    },
    {
        id: "riddle-003",
        clues: [
            "Je suis né en Corse en 1769.",
            "Je suis devenu empereur des Français en 1804.",
            "J'ai été vaincu à Waterloo en 1815.",
            "Je suis mort en exil sur l'île de Sainte-Hélène.",
        ],
        answer: "Napoléon",
        choices: ["Louis XIV", "Napoléon Bonaparte", "Charlemagne", "Robespierre"],
        correctIndex: 1,
    },
    {
        id: "riddle-004",
        clues: [
            "Je suis le plus grand océan du monde.",
            "Je couvre environ un tiers de la surface du globe.",
            "Je borde l'Asie, l'Océanie et les Amériques.",
            "La fosse des Mariannes se trouve dans mes profondeurs.",
        ],
        answer: "Pacifique",
        choices: ["L'Atlantique", "L'océan Indien", "Le Pacifique", "L'océan Arctique"],
        correctIndex: 2,
    },
    {
        id: "riddle-005",
        clues: [
            "Je suis un peintre néerlandais du XIXe siècle.",
            "J'ai peint plus de 2 000 œuvres en une décennie.",
            "Je me suis coupé une partie de l'oreille.",
            "Mon tableau le plus célèbre montre une nuit étoilée.",
        ],
        answer: "Van Gogh",
        choices: ["Claude Monet", "Vincent van Gogh", "Paul Cézanne", "Edgar Degas"],
        correctIndex: 1,
    },
    {
        id: "riddle-006",
        clues: [
            "Je suis un pays d'Amérique du Sud.",
            "Ma capitale est Brasilia.",
            "Je suis le plus grand pays du continent.",
            "La forêt amazonienne couvre une grande partie de mon territoire.",
        ],
        answer: "Brésil",
        choices: ["L'Argentine", "Le Pérou", "Le Brésil", "La Colombie"],
        correctIndex: 2,
    },
    {
        id: "riddle-007",
        clues: [
            "Je suis une invention du XVe siècle.",
            "Je suis attribuée à Johannes Gutenberg.",
            "J'ai permis de reproduire des textes en grand nombre.",
            "Je fonctionne avec des caractères mobiles en métal.",
        ],
        answer: "imprimerie",
        choices: ["La boussole", "L'imprimerie", "La poudre à canon", "Le télescope"],
        correctIndex: 1,
    },
    {
        id: "riddle-008",
        clues: [
            "Je suis la plus grande planète du système solaire.",
            "Je suis une géante gazeuse.",
            "J'ai une grande tache rouge, une tempête géante.",
            "Je porte le nom du roi des dieux romains.",
        ],
        answer: "Jupiter",
        choices: ["Saturne", "Neptune", "Jupiter", "Uranus"],
        correctIndex: 2,
    },
    {
        id: "riddle-009",
        clues: [
            "Je suis un dramaturge anglais du XVIe siècle.",
            "Je suis né à Stratford-upon-Avon.",
            "J'ai écrit Hamlet et Roméo et Juliette.",
            "On me surnomme le Barde d'Avon.",
        ],
        answer: "Shakespeare",
        choices: ["Charles Dickens", "William Shakespeare", "Oscar Wilde", "Lord Byron"],
        correctIndex: 1,
    },
    {
        id: "riddle-010",
        clues: [
            "Je suis un monument parisien construit en 1889.",
            "Je mesure environ 330 mètres de haut.",
            "Je devais être démolie 20 ans après ma construction.",
            "Je porte le nom de mon ingénieur.",
        ],
        answer: "Tour Eiffel",
        choices: ["L'Arc de Triomphe", "La tour Eiffel", "Le Sacré-Cœur", "Notre-Dame"],
        correctIndex: 1,
    },
    {
        id: "riddle-011",
        clues: [
            "Je suis le plus grand animal terrestre.",
            "J'ai de grandes oreilles et une trompe.",
            "Je vis en Afrique ou en Asie.",
            "Mes défenses sont en ivoire.",
        ],
        answer: "éléphant",
        choices: ["Le rhinocéros", "L'hippopotame", "L'éléphant", "La girafe"],
        correctIndex: 2,
    },
    {
        id: "riddle-012",
        clues: [
            "Je suis l'élément chimique le plus léger.",
            "Je suis le plus abondant de l'univers.",
            "Mon symbole est H.",
            "Je compose l'eau avec l'oxygène.",
        ],
        answer: "hydrogène",
        choices: ["L'hélium", "L'hydrogène", "Le carbone", "L'azote"],
        correctIndex: 1,
    },
    {
        id: "riddle-013",
        clues: [
            "Je suis une ville d'Italie.",
            "Je suis construite sur plus de 100 îles.",
            "Mes rues sont des canaux.",
            "Mon célèbre pont s'appelle le Rialto.",
        ],
        answer: "Venise",
        choices: ["Florence", "Venise", "Naples", "Gênes"],
        correctIndex: 1,
    },
    {
        id: "riddle-014",
        clues: [
            "Je regroupe la course, le saut et le lancer.",
            "Je suis pratiqué depuis les Jeux antiques.",
            "Mon nom vient du grec « athlon », qui signifie combat.",
            "Usain Bolt en est l'une de mes plus grandes légendes.",
        ],
        answer: "athlétisme",
        choices: ["La gymnastique", "La natation", "L'athlétisme", "Le triathlon"],
        correctIndex: 2,
    },
    {
        id: "riddle-015",
        clues: [
            "Je suis un instrument à cordes.",
            "Je possède généralement 6 cordes.",
            "Je peux être acoustique ou électrique.",
            "Jimi Hendrix en jouait avec virtuosité.",
        ],
        answer: "guitare",
        choices: ["Le violon", "La guitare", "Le banjo", "La harpe"],
        correctIndex: 1,
    },
    {
        id: "riddle-016",
        clues: [
            "Je suis un physicien allemand.",
            "J'ai formulé la théorie de la relativité.",
            "Mon équation la plus célèbre est E=mc².",
            "J'ai reçu le prix Nobel de physique en 1921.",
        ],
        answer: "Einstein",
        choices: ["Isaac Newton", "Albert Einstein", "Niels Bohr", "Max Planck"],
        correctIndex: 1,
    },
    {
        id: "riddle-017",
        clues: [
            "Je suis la capitale d'un pays d'Europe centrale.",
            "Je suis surnommée le « Paris de l'Est ».",
            "Ma célèbre place s'appelle la place de la Vieille-Ville.",
            "Le Château de Prague me domine.",
        ],
        answer: "Prague",
        choices: ["Budapest", "Vienne", "Prague", "Varsovie"],
        correctIndex: 2,
    },
    {
        id: "riddle-018",
        clues: [
            "Je suis le plus grand désert chaud du monde.",
            "Je m'étends sur une grande partie de l'Afrique du Nord.",
            "Mes dunes peuvent dépasser 180 mètres de haut.",
            "Mon nom signifie « désert » en arabe.",
        ],
        answer: "Sahara",
        choices: ["Le Kalahari", "Le Sahara", "Le désert de Gobi", "Le désert du Namib"],
        correctIndex: 1,
    },
];

export function validateRiddleCorpus(entries: readonly RiddleQuestion[]): void {
    const seenIds = new Set<string>();
    for (const riddle of entries) {
        if (seenIds.has(riddle.id)) {
            throw new Error(`identifiant d'énigme dupliqué : ${riddle.id}`);
        }
        seenIds.add(riddle.id);

        if (riddle.clues.some((clue) => clue.trim().length === 0)) {
            throw new Error(`indice vide pour ${riddle.id}`);
        }
        if (riddle.answer.trim().length === 0) {
            throw new Error(`réponse manquante pour ${riddle.id}`);
        }
        if (riddle.correctIndex < 0 || riddle.correctIndex > 3) {
            throw new Error(`correctIndex hors limites pour ${riddle.id}`);
        }
        const distinctChoices = new Set(riddle.choices.map((choice) => choice.trim()));
        if (riddle.choices.some((choice) => choice.trim().length === 0) || distinctChoices.size !== 4) {
            throw new Error(`propositions du filet invalides pour ${riddle.id} : il faut 4 propositions non vides et distinctes`);
        }
    }
}

validateRiddleCorpus(riddles);

export const ALL_RIDDLES: RiddleQuestion[] = riddles;
