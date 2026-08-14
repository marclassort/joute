import {Href, Router} from "expo-router";

/** router.back() plante silencieusement ("GO_BACK not handled") si l'écran n'a pas d'historique
 * (ex. ouvert via un lien profond). Retombe sur `fallback` dans ce cas plutôt que de laisser le bouton retour mort. */
export function goBackOrHome(router: Router, fallback: Href = "/(tabs)"): void {
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace(fallback);
    }
}
