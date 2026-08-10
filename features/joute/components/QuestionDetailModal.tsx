import {FlatList, Image, Modal, Pressable, Text, View, useWindowDimensions} from "react-native";
import React from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {Answer, Player} from "@/game/types";
import {CATEGORY_LABELS} from "../constants";
import {FlatQuestionEntry} from "../types";

export interface QuestionDetailModalProps {
    visible: boolean;
    onClose: () => void;
    entries: FlatQuestionEntry[];
    initialIndex: number;
    me: Player;
    opponent: Player;
}

function formatResponseTime(answer?: Answer): string {
    if (!answer) return "Pas encore répondu";
    if (answer.selectedIndex === null) return `Temps écoulé (${(answer.elapsedMs / 1000).toFixed(1)} s)`;
    return `${(answer.elapsedMs / 1000).toFixed(1)} s`;
}

interface PageProps {
    entry: FlatQuestionEntry;
    me: Player;
    opponent: Player;
    width: number;
}

const QuestionDetailPage = ({entry, me, opponent, width}: PageProps) => {
    const {question, round, myAnswer, opponentAnswer} = entry;

    return (
        <View style={{width}} className="gap-4 p-5">
            <Text className="joute-step-subtitle">{CATEGORY_LABELS[round.category]}</Text>
            <Text className="joute-question-statement">{question.statement}</Text>

            <View className="gap-3">
                {question.choices.map((choice, index) => {
                    const isCorrectChoice = index === question.correctIndex;
                    const mineHere = myAnswer?.selectedIndex === index;
                    const opponentHere = opponentAnswer?.selectedIndex === index;

                    return (
                        <View key={choice} className={clsx("joute-choice", isCorrectChoice && "joute-recap-correct-choice")}>
                            <View className="joute-detail-choice-row">
                                {mineHere &&
                                    (me.avatarUrl ? (
                                        <Image source={{uri: me.avatarUrl}} className="joute-mini-avatar" />
                                    ) : (
                                        <View className="joute-mini-avatar bg-muted" />
                                    ))}
                                {opponentHere &&
                                    (opponent.avatarUrl ? (
                                        <Image source={{uri: opponent.avatarUrl}} className="joute-mini-avatar" />
                                    ) : (
                                        <View className="joute-mini-avatar bg-muted" />
                                    ))}
                                <Text className="joute-choice-text">{choice}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            <View className="gap-1">
                <Text className="joute-card-meta">Toi : {formatResponseTime(myAnswer)}</Text>
                <Text className="joute-card-meta">
                    {opponent.displayName} : {formatResponseTime(opponentAnswer)}
                </Text>
            </View>

            <View className="joute-recap-card">
                <Text className="joute-recap-explanation">{question.explanation}</Text>
            </View>
        </View>
    );
};

const QuestionDetailModal = ({visible, onClose, entries, initialIndex, me, opponent}: QuestionDetailModalProps) => {
    const {width} = useWindowDimensions();

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="modal-overlay">
                <View className="mt-auto">
                    <View className="modal-container">
                        <View className="modal-header">
                            <Text className="modal-title">Question</Text>
                            <Pressable className="modal-close" onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer">
                                <Text className="modal-close-text">×</Text>
                            </Pressable>
                        </View>

                        <View className="joute-modal-pager">
                            {visible && entries.length > 0 && (
                                <FlatList
                                    data={entries}
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    initialScrollIndex={initialIndex}
                                    getItemLayout={(_, index) => ({length: width, offset: width * index, index})}
                                    keyExtractor={(entry) => entry.question.id}
                                    renderItem={({item}) => <QuestionDetailPage entry={item} me={me} opponent={opponent} width={width} />}
                                />
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default QuestionDetailModal;
