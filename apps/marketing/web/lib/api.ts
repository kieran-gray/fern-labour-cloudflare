import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const postsDirectory = join(process.cwd(), '_posts');

export interface Post {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    readingTime: string;
    category: string;
    content: string;
    [key: string]: string | number | boolean;
}

export function getPostSlugs() {
    if (!fs.existsSync(postsDirectory)) {
        return [];
    }
    return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug: string, fields: string[] = []): Post {
    const realSlug = slug.replace(/\.md$/, '');
    const fullPath = join(postsDirectory, `${realSlug}.md`);

    if (!fs.existsSync(fullPath)) {
        throw new Error(`Post not found: ${realSlug}`);
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const items: Partial<Post> = {};

    fields.forEach((field) => {
        if (field === 'slug') {
            items[field] = realSlug;
        }
        if (field === 'content') {
            items[field] = content;
        }

        if (typeof data[field] !== 'undefined') {
            items[field] = data[field];
        }
    });

    return items as Post;
}

export function getAllPosts(fields: string[] = []): Post[] {
    const slugs = getPostSlugs();
    const posts = slugs
        .map((slug) => getPostBySlug(slug, fields))
        .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
    return posts;
}
