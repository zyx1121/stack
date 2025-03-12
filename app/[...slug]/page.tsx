import fs from "fs";
import matter from "gray-matter";
import { marked } from "marked";
import { notFound } from "next/navigation";
import path from "path";
import { use } from "react";
import { codeToHtml } from "shiki";

const STACK_DIR = path.join(process.cwd(), "stack");

export const dynamic = "force-static";
export const revalidate = false;

export async function generateStaticParams() {
  const files = getAllFiles(STACK_DIR);
  return files.map((file) => ({
    slug: file
      .replace(STACK_DIR, "")
      .replace(/\.mdx?$/, "")
      .split("/")
      .filter(Boolean),
  }));
}

function getAllFiles(dir: string): string[] {
  const files = fs.readdirSync(dir);
  let allFiles: string[] = [];
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      allFiles = allFiles.concat(getAllFiles(filePath));
    } else if (file.match(/\.mdx?$/)) {
      allFiles.push(filePath);
    }
  });
  return allFiles;
}

async function highlightCodeBlocks(html: string): Promise<string> {
  const codeBlockRegex =
    /<pre><code class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/g;

  let lastIndex = 0;
  let match;

  const segments: {
    type: "text" | "code";
    content: string;
    language?: string;
  }[] = [];

  while ((match = codeBlockRegex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: html.substring(lastIndex, match.index),
      });
    }

    const language = match[1];
    const code = match[2]
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");

    segments.push({
      type: "code",
      content: code,
      language,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    segments.push({
      type: "text",
      content: html.substring(lastIndex),
    });
  }

  const processedSegments = await Promise.all(
    segments.map(async (segment) => {
      if (segment.type === "text") {
        return segment.content;
      }

      try {
        const lightHtml = await codeToHtml(segment.content, {
          lang: segment.language || "text",
          theme: "github-light",
        });

        const darkHtml = await codeToHtml(segment.content, {
          lang: segment.language || "text",
          theme: "github-dark",
        });

        return `
          <div class="shiki-container" data-language="${segment.language}">
            <div class="shiki-light">${lightHtml}</div>
            <div class="shiki-dark dark:!block hidden">${darkHtml}</div>
          </div>
        `;
      } catch {
        return `<pre><code class="language-${segment.language}">${segment.content}</code></pre>`;
      }
    })
  );

  return processedSegments.join("");
}

function addIdsToHeadings(html: string): string {
  const headingRegex = /<(h[1-6])(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g;

  const usedIds = new Set<string>();

  return html.replace(headingRegex, (match, tag, content) => {
    const plainText = content.replace(/<[^>]*>/g, "");

    let id = plainText.toLowerCase().replace(/\s+/g, "-");

    if (!id || id.replace(/[^\w-]/g, "") === "") {
      id = `heading-${usedIds.size + 1}`;
    } else {
      id = id.replace(/[^\w-]/g, "");
    }

    let uniqueId = id;
    let counter = 1;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${id}-${counter}`;
      counter++;
    }

    usedIds.add(uniqueId);

    return `<${tag} id="${uniqueId}">${content}</${tag}>`;
  });
}

function generateTOC(html: string) {
  const headingRegex =
    /<(h[2-6])(?:\s[^>]*)?id="([^"]+)"(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g;
  const headings: { id: string; text: string; level: number }[] = [];

  console.log("HTML content for TOC generation:", html);

  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const tag = match[1];
    const id = match[2];
    const text = match[3].replace(/<[^>]*>/g, "");
    const level = parseInt(tag.substring(1));

    if (level >= 2) {
      headings.push({ id, text, level });
    }
  }

  console.log("Generated TOC headings:", headings);

  return headings;
}

async function processMDX(slugPath: string) {
  const filePath = path.join(STACK_DIR, `${slugPath}.mdx`);
  if (!fs.existsSync(filePath)) {
    notFound();
  }
  const source = fs.readFileSync(filePath, "utf-8");
  const { content: mdxContent, data: frontMatter } = matter(source);

  let htmlContent = await marked.parse(mdxContent);

  htmlContent = await highlightCodeBlocks(htmlContent);

  htmlContent = addIdsToHeadings(htmlContent);

  const toc = generateTOC(htmlContent);

  return {
    htmlContent,
    frontMatter,
    toc,
  };
}

function TableOfContents({
  toc,
}: {
  toc: { id: string; text: string; level: number }[];
}) {
  if (toc.length === 0) {
    return <div className="w-64 p-4 overflow-auto" />;
  }

  return (
    <div className="w-64 p-4 overflow-auto">
      <nav className="space-y-1">
        {toc.map((heading, index) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`toc-link block text-sm p-2 rounded-md transition-colors hover:text-primary ${
              index === 0 ? "text-primary font-medium" : "text-muted-foreground"
            }`}
            style={{
              paddingLeft: `${(heading.level - 1) * 0.5}rem`,
            }}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}

export default function MDXPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = use(params);
  const slugPath = resolvedParams.slug.join("/");
  const { htmlContent, frontMatter, toc } = use(processMDX(slugPath));

  const filteredToc = toc.filter((heading) => heading.level >= 2);

  return (
    <div className="w-full flex flex-row">
      <div className="w-full flex flex-col items-center">
        <article className="w-full max-w-3xl prose dark:prose-invert p-8 md:pt-16">
          <div className="md:mb-16">
            {frontMatter.title && (
              <h1 className="text-3xl font-bold mb-2" id="page-title">
                {frontMatter.title}
              </h1>
            )}
            {frontMatter.description && (
              <p className="text-muted-foreground">{frontMatter.description}</p>
            )}
            {frontMatter.date && (
              <div className="text-sm text-muted-foreground mt-2">
                {new Date(frontMatter.date).toLocaleDateString()}
              </div>
            )}
          </div>
          <div
            className="mdx-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>
      </div>

      <div className="w-64 min-h-dvh border-l pt-16 bg-background hidden lg:block">
        <TableOfContents toc={filteredToc} />
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              const tocLinks = document.querySelectorAll('.toc-link');
              const headings = document.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]');

              const observer = new IntersectionObserver(
                (entries) => {
                  entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                      tocLinks.forEach(link => {
                        if (link.getAttribute('href') === '#' + entry.target.id) {
                          link.classList.add('text-primary', 'font-medium');
                          link.classList.remove('text-muted-foreground');
                        } else {
                          link.classList.remove('text-primary', 'font-medium');
                          link.classList.add('text-muted-foreground');
                        }
                      });
                    }
                  });
                },
                {
                  rootMargin: "-20px 0px -80% 0px",
                  threshold: 0.1
                }
              );

              headings.forEach((heading) => {
                observer.observe(heading);
              });

              tocLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                  e.preventDefault();
                  const targetId = this.getAttribute('href').substring(1);
                  document.getElementById(targetId)?.scrollIntoView({
                    behavior: 'smooth'
                  });
                });
              });
            });
          `,
        }}
      />
    </div>
  );
}
