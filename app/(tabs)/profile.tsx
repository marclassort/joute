import React from "react";
import {Redirect} from "expo-router";

// L'onglet "Profil" s'ouvre en feuille modale (voir app/profile-modal.tsx et l'interception de
// tabPress dans app/(tabs)/_layout.tsx). Cette route ne sert que de filet si elle est atteinte
// directement (lien profond, retour arrière) — elle redirige aussitôt vers la modale.
export default function Profile() {
    return <Redirect href="/profile-modal" />;
}
