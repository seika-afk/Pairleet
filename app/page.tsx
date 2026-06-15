"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const click = () => {
    router.push("/dashboard");
  };

  return (
    <div>
      <div className="border-black border-b-2">Home Page</div>

      <div className="bg-black text-white hover:bg-gray-300" onClick={click}>
        Dashboard
      </div>
    </div>
  );
}
