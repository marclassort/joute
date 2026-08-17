import {Text, TextInput, View} from "react-native";
import React, {useEffect, useState} from "react";
import PressableScale from "@/components/PressableScale";
import {ALL_RIDDLES} from "@/data/riddles";
import {JOUTE_FILET_THRESHOLD, JOUTE_MAX_QUESTIONS, JOUTE_VALUE_TIERS, jouteValueForElapsed} from "@/game/oneWinnerConfig";
import {plateauColors} from "@/constants/theme";
import {playSound} from "@/lib/sounds";
import {OneWinnerGameSummary} from "@/lib/oneWinnerApi";

export interface OneWinnerJouteScreenProps {
    game: OneWinnerGameSummary;
    myId: string;
    onAnswer: (submittedText: string) => Promise<{isCorrect: boolean; pointsAwarded: number}>;
    onFiletAnswer: (selectedIndex: number) => Promise<{isCorrect: boolean; pointsAwarded: number}>;
}

const LETTERS = ["A", "B", "C", "D"];
const CLUE_REVEAL_INTERVAL_MS = 5_000;

const OneWinnerJouteScreen = ({game, myId, onAnswer, onFiletAnswer}: OneWinnerJouteScreenProps) => {
    const [typed, setTyped] = useState("");
    const [filetOpen, setFiletOpen] = useState(false);
    const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
    const [now, setNow] = useState(Date.now());

    const round = game.currentRound;
    const current = round?.openedQuestions[round.openedQuestions.length - 1] ?? null;
    const riddle = current ? ALL_RIDDLES.find((entry) => entry.id === current.questionId) : undefined;

    useEffect(() => {
        setTyped("");
        setFiletOpen(false);
        setBlockedUntil(null);
    }, [current?.questionId]);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 200);
        return () => clearInterval(interval);
    }, []);

    if (!riddle || !current) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="solo-hero-subtitle text-center text-plateau-paper/60">En attente de la manche…</Text>
            </View>
        );
    }

    const elapsedMs = now - current.openedAt;
    const value = jouteValueForElapsed(elapsedMs);
    const revealedClues = Math.min(4, 1 + Math.floor(elapsedMs / CLUE_REVEAL_INTERVAL_MS));
    const filetAvailable = value > 0 && value <= JOUTE_FILET_THRESHOLD;
    const filetUsedOnThisRiddle = (round?.answers ?? []).some((answer) => answer.playerId === myId && answer.questionId === riddle.id && answer.usedFilet);
    const isBlocked = !!blockedUntil && now < blockedUntil;
    const blockedRemainingSec = isBlocked ? Math.ceil((blockedUntil! - now) / 1000) : 0;

    const finalists = game.players.filter((player) => !player.isEliminated);

    const submit = async () => {
        if (isBlocked || typed.trim().length === 0) return;
        const text = typed.trim();
        setTyped("");
        const result = await onAnswer(text);
        playSound(result.isCorrect ? "correct" : "incorrect");
        if (!result.isCorrect) setBlockedUntil(Date.now() + 3_000);
    };

    const submitFilet = async (index: number) => {
        if (filetUsedOnThisRiddle) return;
        setFiletOpen(false);
        const result = await onFiletAnswer(index);
        playSound(result.isCorrect ? "correct" : "incorrect");
    };

    return (
        <View className="flex-1 gap-[10px]">
            <View className="flex-row gap-2">
                {finalists.map((player) => {
                    const score = game.liveStandings.find((standing) => standing.playerId === player.id)?.score ?? 0;
                    const isMe = player.id === myId;
                    return (
                        <View
                            key={player.id}
                            className="one-winner-joute-finalist-card"
                            style={isMe ? {borderColor: plateauColors.coral, backgroundColor: "rgba(244,116,76,0.16)"} : undefined}
                        >
                            <View className="flex-row items-center justify-between gap-[7px]">
                                <Text className="flex-1 text-xs font-sans-bold text-plateau-paper" numberOfLines={1}>
                                    {player.displayName}
                                </Text>
                                <Text className="font-display text-base text-plateau-paper">{score}</Text>
                            </View>
                            <View className="one-winner-joute-finalist-bar-track">
                                <View className="one-winner-joute-finalist-bar-fill" style={{width: `${Math.min(100, (score / 200) * 100)}%`}} />
                            </View>
                        </View>
                    );
                })}
            </View>

            <View className="flex-row gap-[5px]">
                {JOUTE_VALUE_TIERS.map((tier) => (
                    <View key={tier.points} className={tier.points === value ? "one-winner-joute-value-tier one-winner-joute-value-tier-active" : "one-winner-joute-value-tier"}>
                        <Text className={tier.points === value ? "one-winner-joute-value-tier-points one-winner-joute-value-tier-points-active" : "one-winner-joute-value-tier-points"}>
                            {tier.points}
                        </Text>
                    </View>
                ))}
            </View>

            <View className="flex-1 gap-[11px] rounded-[24px] border border-plateau-paper/[0.14] bg-plateau-paper/[0.07] p-[18px]">
                <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-eyebrow text-plateau-brass">Énigme</Text>
                    <Text className="rounded-lg bg-plateau-brass/20 px-2 py-[3px] text-[11.5px] font-sans-bold text-plateau-brass">Vaut {value} pts</Text>
                </View>

                <View className="gap-[6px]">
                    {riddle.clues.map((clue, index) => (
                        <View key={clue} className="one-winner-joute-riddle-line" style={{opacity: index < revealedClues ? 1 : 0.25}}>
                            <Text className="one-winner-joute-riddle-number">{index + 1}</Text>
                            <Text className="one-winner-joute-riddle-text">{index < revealedClues ? clue : "···"}</Text>
                        </View>
                    ))}
                </View>

                {isBlocked && (
                    <View className="one-winner-joute-blocked-banner">
                        <Text className="one-winner-joute-blocked-timer">{blockedRemainingSec} s</Text>
                        <Text className="one-winner-joute-blocked-text">Mauvaise réponse : aucune perte, buzzer bloqué le temps du décompte.</Text>
                    </View>
                )}

                {filetOpen && !filetUsedOnThisRiddle && (
                    <View className="gap-[7px]">
                        <Text className="text-eyebrow text-plateau-teal">Filet · {Math.round(value / 2)} pts si juste</Text>
                        <View className="flex-row flex-wrap gap-[7px]">
                            {riddle.choices.map((choice, index) => (
                                <PressableScale
                                    key={choice}
                                    activeScale={0.97}
                                    className="min-w-[47%] flex-1 flex-row items-center gap-2 rounded-[13px] border border-plateau-teal/45 bg-plateau-teal/[0.16] px-[11px] py-[9px]"
                                    onPress={() => submitFilet(index)}
                                    accessibilityRole="button"
                                >
                                    <Text className="font-display text-[11.5px] text-plateau-teal">{LETTERS[index]}</Text>
                                    <Text className="flex-1 text-xs font-sans-semibold text-plateau-paper" numberOfLines={1}>
                                        {choice}
                                    </Text>
                                </PressableScale>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <View className="flex-row gap-[9px]">
                <TextInput
                    value={typed}
                    onChangeText={setTyped}
                    placeholder={isBlocked ? "Bloqué…" : "Ta réponse…"}
                    placeholderTextColor="rgba(246,240,230,0.4)"
                    editable={!isBlocked}
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
                        color: isBlocked ? "rgba(246,240,230,0.35)" : plateauColors.paper,
                    }}
                />
                <PressableScale
                    activeScale={0.96}
                    className={filetOpen ? "one-winner-joute-filet-button one-winner-joute-filet-button-open" : "one-winner-joute-filet-button"}
                    onPress={() => setFiletOpen((open) => !open)}
                    disabled={!filetAvailable || filetUsedOnThisRiddle}
                    style={!filetAvailable || filetUsedOnThisRiddle ? {opacity: 0.35} : undefined}
                    accessibilityRole="button"
                >
                    <Text className={filetOpen ? "one-winner-joute-filet-label one-winner-joute-filet-label-open" : "one-winner-joute-filet-label"}>Filet</Text>
                    <Text className={filetOpen ? "one-winner-joute-filet-state one-winner-joute-filet-state-open" : "one-winner-joute-filet-state"}>
                        {filetUsedOnThisRiddle ? "utilisé" : `${Math.round(value / 2)} pts`}
                    </Text>
                </PressableScale>
                <PressableScale
                    activeScale={0.96}
                    className="solo-cta-button"
                    style={{width: 74, height: 58, paddingVertical: 0, alignItems: "center", justifyContent: "center"}}
                    onPress={submit}
                    disabled={isBlocked || typed.trim().length === 0}
                    accessibilityRole="button"
                >
                    <Text className="font-display text-xl text-plateau-ink">OK</Text>
                </PressableScale>
            </View>

            <Text className="text-center text-[10.5px] font-sans-medium text-plateau-paper/40">
                Question {round?.openedQuestions.length ?? 1} / {JOUTE_MAX_QUESTIONS}
            </Text>
        </View>
    );
};

export default OneWinnerJouteScreen;
