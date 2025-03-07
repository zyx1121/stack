const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const STACK_DIR = path.join(process.cwd(), "stack");
const OUTPUT_JSON_FILE = path.join(process.cwd(), "public", "mdx-files.json");
const OUTPUT_TS_FILE = path.join(process.cwd(), "lib", "mdx-files.ts");

if (!fs.existsSync(path.join(process.cwd(), "public"))) {
  fs.mkdirSync(path.join(process.cwd(), "public"));
}

if (!fs.existsSync(path.join(process.cwd(), "lib"))) {
  fs.mkdirSync(path.join(process.cwd(), "lib"));
}

function getAllMDXFiles(dir, basePath = "") {
  const files = fs.readdirSync(dir);
  let mdxFiles = [];

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const relativePath = path.join(basePath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      mdxFiles = mdxFiles.concat(getAllMDXFiles(filePath, relativePath));
    } else if (file.match(/\.mdx?$/)) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const { data } = matter(content);
        const slug = relativePath.replace(/\.mdx?$/, "");
        const directory = basePath || null;

        mdxFiles.push({
          slug,
          title: data.title || slug,
          path: `/${slug}`,
          directory,
        });
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      }
    }
  });

  return mdxFiles;
}

const mdxFiles = getAllMDXFiles(STACK_DIR);

fs.writeFileSync(
  OUTPUT_JSON_FILE,
  JSON.stringify({ files: mdxFiles }, null, 2)
);

const tsContent = `// 此文件由 scripts/generate-mdx-list.js 自動生成
// 不要手動修改

export interface MDXFile {
  slug: string;
  title: string;
  path: string;
  directory: string | null;
}

export const mdxFiles: MDXFile[] = ${JSON.stringify(mdxFiles, null, 2)};

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
`;

fs.writeFileSync(OUTPUT_TS_FILE, tsContent);

const dtsFile = path.join(process.cwd(), "lib", "mdx-files.d.ts");
if (fs.existsSync(dtsFile)) {
  fs.unlinkSync(dtsFile);
}

console.log(
  `Generated MDX file list with ${mdxFiles.length} files at ${OUTPUT_JSON_FILE} and ${OUTPUT_TS_FILE}`
);
