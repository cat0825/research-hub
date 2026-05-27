"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Code2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          研究资源中心
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/knowledge">
            <Button variant="ghost" size="sm">
              知识
            </Button>
          </Link>
          <Link href="/graphs">
            <Button variant="ghost" size="sm">
              图谱
            </Button>
          </Link>
          <a
            href="https://github.com/cat0825/research-hub"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub 项目"
            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Code2Icon className="size-4" />
          </a>
          {session?.user ? (
            <>
              <Link href="/bookmarks">
                <Button variant="ghost" size="sm">
                  收藏
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  发布
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.avatar_url} />
                    <AvatarFallback>
                      {session.user.github_username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {session.user.github_username}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => signOut()}>
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => signIn("github")} size="sm">
              GitHub 登录
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
