import {NotificationService} from "./notifications";

/**
 * Notifications push distantes, pour quand un serveur d'appariement existera.
 *
 * TODO: implémenter une fois le backend disponible :
 *  - enregistrer le token Expo Push de l'appareil (expo-notifications `getExpoPushTokenAsync`)
 *    auprès du serveur, associé à l'utilisateur Clerk courant ;
 *  - envoyer les notifications "c'est ton tour" / "partie terminée" / "expire bientôt" via
 *    l'API Expo Push côté serveur plutôt qu'en local, dès qu'un vrai adversaire (pas un
 *    fantôme) joue son tour sur un autre appareil ;
 *  - remplacer `localNotificationService` par cette implémentation pour les parties contre
 *    un adversaire réel, tout en gardant `localNotificationService` pour les parties contre
 *    un fantôme (qui restent purement locales).
 *
 * En attendant, aucune méthode n'est fonctionnelle : ce fichier ne fait que garder
 * l'interface prête pour ce futur branchement.
 */
export const remoteNotificationService: NotificationService = {
    async requestPermission() {
        throw new Error("TODO: remoteNotificationService nécessite un serveur d'appariement, pas encore disponible");
    },
    async notifyYourTurn() {
        throw new Error("TODO: remoteNotificationService nécessite un serveur d'appariement, pas encore disponible");
    },
    async notifyMatchFinished() {
        throw new Error("TODO: remoteNotificationService nécessite un serveur d'appariement, pas encore disponible");
    },
    async scheduleExpiringSoon() {
        throw new Error("TODO: remoteNotificationService nécessite un serveur d'appariement, pas encore disponible");
    },
    async cancelExpiringSoon() {
        throw new Error("TODO: remoteNotificationService nécessite un serveur d'appariement, pas encore disponible");
    },
};
