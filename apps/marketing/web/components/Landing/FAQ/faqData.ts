export interface FAQItem {
    question: string;
    answer: string;
}

export const faqs: FAQItem[] = [
    {
        question: 'Is Fern Labour really free for mums?',
        answer:
            'Yes, completely free. Track unlimited contractions, invite your birth partner to help track, and share updates with as many people as you want. No limits, no subscriptions. Your circle can follow for free too, or upgrade individually for instant notifications.',
    },
    {
        question: 'How do I invite people to my circle?',
        answer:
            "Share your personal invite link with anyone you choose. When they use it, they'll appear in your requests. You approve or reject each person. You can block someone or create a new link anytime to control who has access.",
    },
    {
        question: 'What can my birth partner do?',
        answer:
            'Your birth partner can track contractions from their own phone and send updates on your behalf. Everything syncs instantly between your devices. You can give this role to one person or multiple people.',
    },
    {
        question: "What's the difference between the subscriber roles?",
        answer:
            'Birth Partner can track contractions and send updates. Support Person sees detailed stats and all your updates. Loved One sees your updates and announcements only. You choose who gets which level of access.',
    },
    {
        question: 'Do I need to download an app?',
        answer:
            "No. Fern Labour runs in your browser on any device. You can track contractions offline and they'll sync when you're back online. Create an account once, then access from anywhere.",
    },
    {
        question: 'What happens to my data?',
        answer:
            'Your data is stored in its own isolated database, completely separate from other users. It stays secure until you delete it. If you delete your account, everything is permanently erased. We never sell or share your data.',
    },
];
