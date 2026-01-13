'use client';

import { useState } from 'react';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import classes from './FAQ.module.css';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={classes.root}>
      <Container size="sm" className={classes.inner}>
        <motion.div
          className={classes.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>Common questions</Title>
          <Text className={classes.subtitle}>
            Everything you need to know before getting started
          </Text>
        </motion.div>

        <motion.div
          className={classes.list}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className={classes.item}
              data-open={openIndex === index}
              variants={itemVariants}
            >
              <button
                type="button"
                className={classes.question}
                onClick={() => toggleItem(index)}
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                <span className={classes.icon}>
                  {openIndex === index ? (
                    <IconMinus size={18} stroke={2} />
                  ) : (
                    <IconPlus size={18} stroke={2} />
                  )}
                </span>
              </button>
              <div className={classes.answerWrapper}>
                <div className={classes.answer}>
                  <Text>{faq.answer}</Text>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </div>
  );
}
