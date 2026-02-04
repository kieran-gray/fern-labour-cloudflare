import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ErrorPage from 'next/error';
import { Title, Text, Group, Badge, Button, Avatar, Paper, Box } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { getPostBySlug, getAllPosts, Post } from '../../lib/api';
import { Header01 } from '../../components/Header/Header';
import { FooterSimple } from '../../components/Footer/Footer';
import { ContactMessageFloating } from '../../components/ContactUsFloating/ContactUsFloating';
import styles from '../../components/Blog/BlogPost.module.css';

interface BlogPostProps {
    post: Post;
}

export default function BlogPost({ post }: BlogPostProps) {
    const router = useRouter();

    if (!router.isFallback && !post?.slug) {
        return <ErrorPage statusCode={404} />;
    }

    return (
        <>
            <Head>
                <title>{post.title} — Fern Labour</title>
                <meta name="description" content={post.excerpt} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.excerpt} />
                <meta property="og:type" content="article" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'BlogPosting',
                            headline: post.title,
                            description: post.excerpt,
                            datePublished: post.date,
                            author: {
                                '@type': 'Organization',
                                name: 'Fern Labour',
                            },
                        }),
                    }}
                />
            </Head>

            <Header01
                breakpoint="sm"
                callToActionTitle="Go to app"
                callToActionUrl={process.env.NEXT_PUBLIC_APP_LABOUR_WEB_URL}
            />

            <div style={{ padding: '0px 15px' }}>
                <div className={styles.root}>
                    <Button
                        component={Link}
                        href="/blog"
                        variant="subtle"
                        color="pink"
                        leftSection={<IconArrowLeft size={16} />}
                        radius="lg"
                        mb="xl"
                        style={{ alignSelf: 'flex-start' }}
                    >
                        Back to blog
                    </Button>

                    <Group mb="md" gap="xs">
                        <Badge color="pink" variant="light" size="lg">
                            {post.category}
                        </Badge>
                        <Text c="dimmed">•</Text>
                        <Text c="dimmed">{format(new Date(post.date), 'MMMM d, yyyy')}</Text>
                        <Text c="dimmed">•</Text>
                        <Text c="dimmed">{post.readingTime}</Text>
                    </Group>

                    <Title
                        order={1}
                        mb="xl"
                        fz={{ base: '2rem', sm: '2.5rem' }}
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            lineHeight: 1.2,
                            fontWeight: 600,
                            color: '#2C2E33'
                        }}
                    >
                        {post.title}
                    </Title>

                    <Text size="xl" lh={1.6} mb={50} c="dimmed" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                        {post.excerpt}
                    </Text>

                    <div className={styles.content}>
                        <ReactMarkdown>{post.content}</ReactMarkdown>
                    </div>

                    <Paper p={{ base: 'lg', sm: 'xl' }} radius="xl" mt={80} style={{ backgroundColor: '#fdf9f8ff', width: '100%' }}>
                        {/* Mobile Layout */}
                        <Box hiddenFrom="sm">
                            <Group mb="sm" align="center">
                                <Avatar src="/favicon/favicon.svg" size={48} radius="md" color="pink" />
                                <Text size="lg" fw={600} style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    About Fern Labour
                                </Text>
                            </Group>
                            <Text c="dimmed" mb="md" lh={1.6}>
                                We're a small, supportive team building tools to help you stay present and calm during labour.
                                Our app lets you track your contractions quietly and keep your loved ones in the loop without the noise.
                            </Text>
                            <Button
                                component="a"
                                href={process.env.NEXT_PUBLIC_APP_LABOUR_WEB_URL || "https://app.fernlabour.com"}
                                variant="light"
                                color="pink"
                                radius="xl"
                                fullWidth
                            >
                                Try Fern Labour for free
                            </Button>
                        </Box>

                        {/* Desktop Layout */}
                        <Group wrap="nowrap" align="flex-start" visibleFrom="sm">
                            <Avatar src="/favicon/favicon.svg" size={60} radius="md" color="pink" />
                            <div>
                                <Text size="lg" fw={600} mb="xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    About Fern Labour
                                </Text>
                                <Text c="dimmed" mb="md" lh={1.6}>
                                    We're a small, supportive team building tools to help you stay present and calm during labour.
                                    Our app lets you track your contractions quietly and keep your loved ones in the loop without the noise.
                                </Text>
                                <Button
                                    component="a"
                                    href={process.env.NEXT_PUBLIC_APP_LABOUR_WEB_URL || "https://app.fernlabour.com"}
                                    variant="light"
                                    color="pink"
                                    radius="xl"
                                >
                                    Try Fern Labour for free
                                </Button>
                            </div>
                        </Group>
                    </Paper>
                </div>
            </div>

            <ContactMessageFloating />

            <div style={{ backgroundColor: '#fff5f5' }}>
                <FooterSimple />
            </div>
        </>
    );
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
    const post = getPostBySlug(params.slug, [
        'title',
        'date',
        'slug',
        'author',
        'content',
        'ogImage',
        'coverImage',
        'excerpt',
        'readingTime',
        'category',
    ]);
    const content = post.content || '';

    return {
        props: {
            post: {
                ...post,
                content,
            },
        },
    };
}

export async function getStaticPaths() {
    const posts = getAllPosts(['slug']);

    return {
        paths: posts.map((post) => {
            return {
                params: {
                    slug: post.slug,
                },
            };
        }),
        fallback: false,
    };
}
