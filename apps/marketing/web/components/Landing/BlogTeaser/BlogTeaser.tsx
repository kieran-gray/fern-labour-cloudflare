import Link from 'next/link';
import { motion } from 'motion/react';
import { Button, Container, SimpleGrid, Text, Title } from '@mantine/core';
import { BlogCard } from '@/components/Blog/BlogCard';
import { Post } from '@/lib/api';
import { fadeUp, staggerContainer } from '@/lib/motion';
import classes from './BlogTeaser.module.css';

interface BlogTeaserProps {
  posts: Post[];
}

export function BlogTeaser({ posts }: BlogTeaserProps) {
  return (
    <div className={classes.root}>
      <Container size="lg">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title order={2} className={classes.title}>
            Helpful reading
          </Title>
          <Text className={classes.subtitle} ta="center" mb={50}>
            Guides and articles to help you prepare.
          </Text>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {posts.map((post) => (
              <motion.div key={post.slug} variants={fadeUp}>
                <BlogCard
                  title={post.title}
                  excerpt={post.excerpt}
                  date={post.date}
                  category={post.category}
                  readingTime={post.readingTime}
                  slug={post.slug}
                />
              </motion.div>
            ))}
          </SimpleGrid>
        </motion.div>

        <div className={classes.buttonContainer}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              component={Link}
              href="/blog"
              variant="light"
              color="pink"
              size="md"
              radius="xl"
            >
              View all posts
            </Button>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}
