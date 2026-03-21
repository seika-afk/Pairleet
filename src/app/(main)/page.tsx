"use client"
import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
	<div className="h-screen gap-1 w-screen flex items-center flex-col justify-center">
<UserButton afterSignOutUrl="/" />

	<ModeToggle/>

</div>

  )}
