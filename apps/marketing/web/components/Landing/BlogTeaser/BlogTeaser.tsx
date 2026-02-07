import Link from 'next/link';
import { Button, Container, SimpleGrid, Text, Title } from '@mantine/core';
import { BlogCard } from '@/components/Blog/BlogCard';
import { Post } from '@/lib/api';
import classes from './BlogTeaser.module.css';

interface BlogTeaserProps {
  posts: Post[];
}

export function BlogTeaser({ posts }: BlogTeaserProps) {
  return (
    <div className={classes.root}>
      <Container size="lg">
        <Title order={2} className={classes.title}>
          Helpful reading
        </Title>
        <Text className={classes.subtitle} ta="center" mb={50}>
          Guides and articles to help you prepare.
        </Text>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              date={post.date}
              category={post.category}
              readingTime={post.readingTime}
              slug={post.slug}
            />
          ))}
        </SimpleGrid>
        <div className={classes.buttonContainer}>
          <Button component={Link} href="/blog" variant="light" color="pink" size="md" radius="xl">
            View all posts
          </Button>
        </div>
      </Container>
    </div>
  );
}
