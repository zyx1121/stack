"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import mdxFiles from "@/public/mdx-files.json";
import Link from "next/link";

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();

  const filesByDirectory = mdxFiles.files.reduce((acc, file) => {
    const directory = file.directory || "root";
    if (!acc[directory]) {
      acc[directory] = [];
    }
    acc[directory].push(file);
    return acc;
  }, {} as Record<string, typeof mdxFiles.files>);

  return (
    <Sidebar>
      <SidebarHeader className="border-b flex flex-row p-2 items-center justify-between">
        <h1 className="text-xl font-bold text-muted-foreground ml-4 p-2">
          Stack
        </h1>
        <ThemeToggle className="mr-2" />
      </SidebarHeader>
      <SidebarContent className="p-2">
        {filesByDirectory["root"] && (
          <SidebarGroup>
            <div className="space-y-1">
              {filesByDirectory["root"].map((file) => (
                <Link
                  key={file.slug}
                  href={file.path}
                  className="flex items-center px-4 py-2 text-sm text-muted-foreground rounded-md hover:bg-muted"
                  onClick={() => {
                    setOpenMobile(false);
                  }}
                >
                  {file.title}
                </Link>
              ))}
            </div>
          </SidebarGroup>
        )}
        {Object.entries(filesByDirectory)
          .filter(([directory]) => directory !== "root")
          .map(([directory, files]) => (
            <SidebarGroup key={directory}>
              <h2 className="text-sm text-muted-foreground font-bold uppercase tracking-wider px-4 py-2">
                {directory}
              </h2>
              <div className="space-y-1">
                {files.map((file) => (
                  <Link
                    key={file.slug}
                    href={file.path}
                    className="flex items-center px-4 py-2 text-sm text-muted-foreground rounded-md hover:bg-muted"
                    onClick={() => {
                      setOpenMobile(false);
                    }}
                  >
                    {file.title}
                  </Link>
                ))}
              </div>
            </SidebarGroup>
          ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
