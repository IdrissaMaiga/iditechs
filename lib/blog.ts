import { deleteObject, getObjectText, putObject } from "./storage";
import readingTime from "reading-time";

const INDEX_KEY = "blog/index.json";
const POST_PREFIX = "blog/posts/";

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
  image: string;
  linkedinPosted: boolean;
}

export interface BlogPost extends BlogPostMeta {
  readingTime: number;
  content: string;
}

async function getIndex(): Promise<BlogPostMeta[]> {
  const raw = await getObjectText(INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse blog index from storage:", err);
    return [];
  }
}

async function saveIndex(index: BlogPostMeta[]): Promise<void> {
  const sorted = index.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  await putObject(INDEX_KEY, JSON.stringify(sorted, null, 2), "application/json");
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const index = await getIndex();
  const posts = await Promise.all(
    index.map(async (meta) => {
      const raw = await getObjectText(`${POST_PREFIX}${meta.slug}.json`);
      if (!raw) return null;
      try {
        const data = JSON.parse(raw);
        const rt = readingTime(data.content || "");
        return { ...meta, content: data.content || "", readingTime: Math.ceil(rt.minutes) };
      } catch (err) {
        console.error(`Failed to parse post ${meta.slug}:`, err);
        return null;
      }
    })
  );
  return posts.filter((p): p is BlogPost => p !== null);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const index = await getIndex();
  const meta = index.find((p) => p.slug === slug);
  if (!meta) return null;

  const raw = await getObjectText(`${POST_PREFIX}${slug}.json`);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    const rt = readingTime(data.content || "");
    return { ...meta, content: data.content || "", readingTime: Math.ceil(rt.minutes) };
  } catch {
    return null;
  }
}

export async function getPostSlugs(): Promise<string[]> {
  const index = await getIndex();
  return index.map((p) => p.slug);
}

export async function createPost(post: {
  title: string;
  content: string;
  tags: string[];
  description: string;
  image: string;
  slug?: string;
}): Promise<{ slug: string }> {
  const slug =
    post.slug ||
    post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const index = await getIndex();
  if (index.find((p) => p.slug === slug)) {
    throw new Error(`Post with slug "${slug}" already exists`);
  }

  const meta: BlogPostMeta = {
    slug,
    title: post.title,
    date: new Date().toISOString().split("T")[0],
    tags: post.tags,
    description: post.description,
    image: post.image,
    linkedinPosted: false,
  };

  await putObject(
    `${POST_PREFIX}${slug}.json`,
    JSON.stringify({ content: post.content }, null, 2),
    "application/json"
  );

  index.push(meta);
  await saveIndex(index);

  return { slug };
}

export async function updatePost(
  slug: string,
  updates: Partial<{
    title: string;
    content: string;
    tags: string[];
    description: string;
    image: string;
    linkedinPosted: boolean;
  }>
): Promise<void> {
  const index = await getIndex();
  const idx = index.findIndex((p) => p.slug === slug);
  if (idx === -1) throw new Error(`Post "${slug}" not found`);

  if (updates.title !== undefined) index[idx].title = updates.title;
  if (updates.tags !== undefined) index[idx].tags = updates.tags;
  if (updates.description !== undefined) index[idx].description = updates.description;
  if (updates.image !== undefined) index[idx].image = updates.image;
  if (updates.linkedinPosted !== undefined) index[idx].linkedinPosted = updates.linkedinPosted;

  if (updates.content !== undefined) {
    await putObject(
      `${POST_PREFIX}${slug}.json`,
      JSON.stringify({ content: updates.content }, null, 2),
      "application/json"
    );
  }

  await saveIndex(index);
}

export async function deletePost(slug: string): Promise<void> {
  const index = await getIndex();
  const filtered = index.filter((p) => p.slug !== slug);
  if (filtered.length === index.length) throw new Error(`Post "${slug}" not found`);

  await deleteObject(`${POST_PREFIX}${slug}.json`);
  await saveIndex(filtered);
}
