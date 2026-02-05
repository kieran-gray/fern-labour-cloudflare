'use client';

import { useState } from 'react';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import classes from './FAQ.module.css';

import { faqs } from './faqData';

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
