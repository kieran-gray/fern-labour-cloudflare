import Link from 'next/link';
import { Card, Text, Badge, Group, Button, useMantineTheme } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';

interface BlogCardProps {
    title: string;
    excerpt: string;
    date: string;
    category: string;
    readingTime: string;
    slug: string;
}

export function BlogCard({ title, excerpt, category, readingTime, slug }: BlogCardProps) {
    const theme = useMantineTheme();

    return (
        <Card
            shadow="sm"
            padding="xl"
            radius="xl"
            withBorder
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: theme.colors.gray[2],
                backgroundColor: theme.white,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            styles={{
                root: {
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows.md,
                    },
                },
            }}
        >
            <div>
                <Group justify="space-between" mb="xs">
                    <Badge color="pink" variant="light" radius="sm">
                        {category}
                    </Badge>
                    <Text size="xs" c="dimmed" style={{ fontFamily: theme.headings.fontFamily }}>
                        {readingTime}
                    </Text>
                </Group>

                <Text fw={600} size="lg" mt="md" mb="xs" style={{ fontFamily: theme.headings.fontFamily }}>
                    {title}
                </Text>

                <Text size="sm" c="dimmed" lineClamp={3}>
                    {excerpt}
                </Text>
            </div>

            <Button
                component={Link}
                href={`/blog/${slug}`}
                variant="subtle"
                color="pink"
                fullWidth
                mt="md"
                radius="lg"
                rightSection={<IconArrowRight size={16} />}
                styles={{
                    root: {
                        justifyContent: 'space-between',
                        paddingLeft: 0,
                        '&:hover': {
                            backgroundColor: 'transparent',
                            textDecoration: 'underline',
                        },
                    },
                }}
            >
                Read article
            </Button>
        </Card>
    );
}
