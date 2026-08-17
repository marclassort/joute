import {Text, TextInput, View} from "react-native";
import React, {useEffect, useMemo, useRef, useState} from "react";
import PressableScale from "@/components/PressableScale";
import {ALL_OPEN_QUESTIONS} from "@/data/openQuestions";
import {pickNextChargeQuestion} from "@/game/oneWinnerQuestionPicker";
import {CHARGE_BASE_POINTS, CHARGE_MULTIPLIERS, CHARGE_TIME_LIMIT_MS, chargeMultiplierForStreak} from "@/game/oneWinnerConfig";
import {OpenQuestion} from "@/game/types";
import {plateauColors} from "@/constants/theme";
import {OneWinnerGameSummary, SubmitChargeAnswerInput} from "@/lib/oneWinnerApi";

export interface OneWinnerChargeScreenProps {
    game: OneWinnerGameSummary;
    myId: string;
    onAnswer: (input: SubmitChargeAnswerInput) => Promise<{isCorrect: boolean; pointsAwarded: number}>;
}

function currentStreak(answers: {playerId: string; isCorrect: boolean}[], playerId: string): number {
    const mine = answers.filter((answer) => answer.playerId === playerId);
    let streak = 0;
    for (let i = mine.length - 1; i >= 0; i--) {
        if (!mine[i].isCorrect) break;
        streak++;
    }
    return streak;
}

const OneWinnerChargeScreen = ({game, myId, onAnswer}: OneWinnerChargeScreenProps) => {
    const [typed, setTyped] = useState("");
    const [remainingSec, setRemainingSec] = useState(0);
    const startedAtRef = useRef(Date.now());
    const questionRef = useRef<OpenQuestion | null>(null);

    const myTheme = game.players.find((player) => player.id === myId)?.chargeTheme ?? "";
    const answers = game.currentRound?.answers ?? [];
    const myAnsweredIds = useMemo(() => answers.filter((answer) => answer.playerId === myId).map((answer) => answer.questionId), [answers, myId]);

    if (!questionRef.current || myAnsweredIds.includes(questionRef.current.id)) {
        questionRef.current = pickNextChargeQuestion(ALL_OPEN_QUESTIONS, myTheme, myAnsweredIds);
    }
    const question = questionRef.current;

    useEffect(() => {
        startedAtRef.current = Date.now();
        setTyped("");
    }, [question?.id]);

    useEffect(() => {
        const startedAt = game.currentRound?.startedAt;
        if (!startedAt) return undefined;
        const tick = () => setRemainingSec(Math.ceil(Math.max(0, CHARGE_TIME_LIMIT_MS - (Date.now() - startedAt)) / 1000));
        tick();
        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
    }, [game.currentRound?.startedAt]);

    const streak = currentStreak(answers, myId);
    const multiplier = chargeMultiplierForStreak(streak);
    const nextPoints = Math.round(CHARGE_BASE_POINTS * multiplier);
    const myScore = game.liveStandings.find((standing) => standing.playerId === myId)?.score ?? 0;

    const rivals = game.players.filter((player) => player.id !== myId && !player.isEliminated);

    const submit = async () => {
        if (!question || typed.trim().length === 0) return;
        const elapsedMs = Date.now() - startedAtRef.current;
        setTyped("");
        await onAnswer({questionId: question.id, submittedText: typed.trim(), elapsedMs});
    };

    const pass = async () => {
        if (!question) return;
        setTyped("");
        await onAnswer({questionId: question.id, submittedText: null, elapsedMs: Date.now() - startedAtRef.current});
    };

    if (!question) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="solo-hero-subtitle text-center text-plateau-paper/60">Plus de questions disponibles dans ce thème — en attente de la fin de la manche…</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 gap-[10px]">
            <View className="flex-row gap-2">
                <View className="one-winner-charge-multiplier">
                    <Text className="one-winner-charge-multiplier-value">×{String(multiplier).replace(".", ",")}</Text>
                    <Text className="one-winner-charge-multiplier-label">MULTI</Text>
                </View>
                <View className="one-winner-charge-next-points">
                    <Text className="one-winner-charge-next-points-label">Prochaine bonne réponse</Text>
                    <Text className="one-winner-charge-next-points-value">+{nextPoints}</Text>
                </View>
            </View>

            <View className="flex-row gap-[5px]">
                {CHARGE_MULTIPLIERS.map((_, index) => (
                    <View key={index} className={index < streak ? "one-winner-charge-streak-dot one-winner-charge-streak-dot-filled" : "one-winner-charge-streak-dot"} />
                ))}
            </View>

            <View className="flex-1 justify-center gap-2 rounded-[24px] border border-plateau-paper/[0.14] bg-plateau-paper/[0.07] p-[18px]">
                <View className="flex-row flex-wrap items-center gap-[7px]">
                    <Text className="text-eyebrow text-plateau-iris">{question.theme}</Text>
                    <Text className="rounded-lg bg-plateau-brass/20 px-2 py-[3px] text-[10.5px] font-sans-bold text-plateau-brass">{remainingSec} s</Text>
                </View>
                <Text className="duel-question-statement">{question.statement}</Text>

                <View className="mt-3 gap-[6px]">
                    {rivals.map((rival) => {
                        const score = game.liveStandings.find((standing) => standing.playerId === rival.id)?.score ?? 0;
                        return (
                            <View key={rival.id} className="one-winner-charge-rival-row">
                                <View className="one-winner-charge-rival-avatar" style={{backgroundColor: plateauColors.iris}}>
                                    <Text className="text-xs text-plateau-paper">{rival.displayName.charAt(0).toUpperCase()}</Text>
                                </View>
                                <Text className="one-winner-charge-rival-state" numberOfLines={1}>
                                    {rival.displayName}
                                </Text>
                                <Text className="one-winner-charge-rival-score">{score}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <View className="flex-row gap-[9px]">
                <TextInput
                    value={typed}
                    onChangeText={setTyped}
                    placeholder="Ta réponse…"
                    placeholderTextColor="rgba(246,240,230,0.4)"
                    onSubmitEditing={submit}
                    returnKeyType="done"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                        flex: 1,
                        height: 58,
                        borderRadius: 19,
                        backgroundColor: "rgba(20,18,31,0.55)",
                        borderWidth: 1,
                        borderColor: "rgba(246,240,230,0.2)",
                        paddingHorizontal: 15,
                        fontSize: 15.5,
                        color: plateauColors.paper,
                    }}
                />
                <PressableScale activeScale={0.96} className="one-winner-charge-pass-button" onPress={pass} accessibilityRole="button">
                    <Text className="one-winner-charge-pass-text">Passe</Text>
                </PressableScale>
                <PressableScale
                    activeScale={0.96}
                    className="solo-cta-button"
                    style={{width: 74, height: 58, paddingVertical: 0, alignItems: "center", justifyContent: "center"}}
                    onPress={submit}
                    disabled={typed.trim().length === 0}
                    accessibilityRole="button"
                >
                    <Text className="font-display text-xl text-plateau-ink">OK</Text>
                </PressableScale>
            </View>

            <Text className="text-center text-[11px] font-sans-medium text-plateau-paper/40">Score actuel : {myScore} pts</Text>
        </View>
    );
};

export default OneWinnerChargeScreen;
