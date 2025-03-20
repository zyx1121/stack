const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const STACK_DIR = path.join(process.cwd(), "stack");
const OUTPUT_JSON_FILE = path.join(process.cwd(), "public", "mdx-files.json");

if (!fs.existsSync(path.join(process.cwd(), "public"))) {
  fs.mkdirSync(path.join(process.cwd(), "public"));
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

console.log(
  `Generated MDX file list with ${mdxFiles.length} files at ${OUTPUT_JSON_FILE}`
);
