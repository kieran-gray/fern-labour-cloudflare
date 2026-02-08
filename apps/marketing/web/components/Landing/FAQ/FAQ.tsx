'use client';

import { useState } from 'react';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { faqs } from './faqData';
import classes from './FAQ.module.css';

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
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>Common questions</Title>
          <Text className={classes.subtitle}>
            Everything you need to know before getting started
          </Text>
        </motion.div>

        <motion.div
          className={classes.list}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className={classes.item}
              data-open={openIndex === index}
              variants={fadeUp}
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
