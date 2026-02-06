import Head from 'next/head';
import { IconHeartHandshake } from '@tabler/icons-react';
import { Box, Container, Group, SimpleGrid, Text, ThemeIcon, Title } from '@mantine/core';
import { BlogCard } from '../../components/Blog/BlogCard';
import { ContactMessageFloating } from '../../components/ContactUsFloating/ContactUsFloating';
import { FooterSimple } from '../../components/Footer/Footer';
import { Header01 } from '../../components/Header/Header';
import { getAllPosts, Post } from '../../lib/api';

interface BlogIndexProps {
  posts: Post[];
}

export default function BlogIndex({ posts }: BlogIndexProps) {
  return (
    <>
      <Head>
        <title>Blog — Fern Labour</title>
        <meta
          name="description"
          content="A calm, supportive space for birth preparation, labour tips, and finding peace of mind."
        />
      </Head>

      <Header01
        breakpoint="sm"
        callToActionTitle="Go to app"
        callToActionUrl={process.env.NEXT_PUBLIC_APP_LABOUR_WEB_URL}
        landingPage={false}
      />

      <div
        style={{
          backgroundColor: '#fdfaf8',
          minHeight: '100vh',
          paddingBottom: 'var(--mantine-spacing-xl)',
        }}
      >
        <Container
          size="lg"
          pt={{ base: 40, sm: 80 }}
          pb={{ base: 40, sm: 80 }}
          px={{ base: 30, sm: 50 }}
        >
          <Box mb={60} style={{ maxWidth: 700 }}>
            <Group mb="md">
              <ThemeIcon variant="light" color="pink" size="lg" radius="xl">
                <IconHeartHandshake style={{ width: '70%', height: '70%' }} />
              </ThemeIcon>
              <Text c="pink" fw={600} style={{ letterSpacing: 0.5 }}>
                The Fern Labour blog
              </Text>
            </Group>

            <Title
              order={1}
              mb="md"
              fz={{ base: '2rem', sm: '3rem' }}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                color: '#2C2E33',
                lineHeight: 1.2,
              }}
            >
              For peace of mind at the end of your pregnancy.
            </Title>

            <Text size="lg" c="dimmed" lh={1.6}>
              Welcome to our quiet corner of the internet. We write about Fern Labour and how to use
              it during labour. Straightforward stuff about contractions, your circle, and staying
              present when it matters.
            </Text>
          </Box>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
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
        </Container>
      </div>

      <ContactMessageFloating />

      <div style={{ backgroundColor: '#fff5f5' }}>
        <FooterSimple />
      </div>
    </>
  );
}

export const getStaticProps = async () => {
  const allPosts = getAllPosts([
    'title',
    'date',
    'slug',
    'excerpt',
    'coverImage',
    'readingTime',
    'category',
  ]);

  return {
    props: { posts: allPosts },
  };
};
