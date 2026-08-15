import React from "react";
import {Redirect} from "expo-router";

// L'onglet "Gagnant" s'ouvre directement sur /one-winner/new (voir l'interception de tabPress dans
// app/(tabs)/_layout.tsx). Cette route ne sert que de filet si elle est atteinte directement (lien
// profond, retour arrière) — elle redirige aussitôt vers le flux réel.
export default function OneWinnerTab() {
    return <Redirect href="/one-winner/new" />;
}
