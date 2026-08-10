import {Answer, Question, Round} from "@/game/types";

export interface FlatQuestionEntry {
    round: Round;
    question: Question;
    myAnswer?: Answer;
    opponentAnswer?: Answer;
}
