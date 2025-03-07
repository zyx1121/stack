// 此文件由 scripts/generate-mdx-list.js 自動生成
// 不要手動修改

export interface MDXFile {
  slug: string;
  title: string;
  path: string;
  directory: string | null;
}

export const mdxFiles: MDXFile[] = [
  {
    "slug": "introduction",
    "title": "Introduction",
    "path": "/introduction",
    "directory": null
  },
  {
    "slug": "tools/cursor",
    "title": "Cursor",
    "path": "/tools/cursor",
    "directory": "tools"
  },
  {
    "slug": "tools/docker",
    "title": "Docker",
    "path": "/tools/docker",
    "directory": "tools"
  },
  {
    "slug": "tools/git",
    "title": "Git",
    "path": "/tools/git",
    "directory": "tools"
  },
  {
    "slug": "tools/vscode",
    "title": "VSCode",
    "path": "/tools/vscode",
    "directory": "tools"
  },
  {
    "slug": "web/nextjs",
    "title": "Next.js",
    "path": "/web/nextjs",
    "directory": "web"
  },
  {
    "slug": "web/shadcn",
    "title": "shadcn/ui",
    "path": "/web/shadcn",
    "directory": "web"
  }
];

export function groupFilesByDirectory(files: MDXFile[]): Record<string, MDXFile[]> {
  const grouped: Record<string, MDXFile[]> = {
    root: [],
  };

  files.forEach((file) => {
    if (!file.directory) {
      grouped["root"].push(file);
    } else {
      if (!grouped[file.directory]) {
        grouped[file.directory] = [];
      }
      grouped[file.directory].push(file);
    }
  });

  return grouped;
}

export const groupedMdxFiles: Record<string, MDXFile[]> = groupFilesByDirectory(mdxFiles);
