import type { TabIconName } from "@/components/TabBarIcon";

declare global {
    interface AppTab {
        name: string;
        title: string;
        icon: TabIconName;
    }

    interface EditProfileModalProps {
        visible: boolean;
        onClose: () => void;
    }

    interface ListHeadingProps {
        title: string;
    }
}

export {};