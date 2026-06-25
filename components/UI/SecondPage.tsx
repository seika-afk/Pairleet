"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const tops = ["top-0", "top-[80px]", "top-[160px]", "top-[240px]"];
const zIndexes = ["z-10", "z-20", "z-30", "z-40"];

export default function SecondPage() {
  const [userCount, setUserCount] = useState<string>("...");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/numUsers")
      .then((r) => r.json())
      .then((d) => setUserCount(String(d.user_length)));
  }, []);

  const sections = [
    {
      title: "Compete",
      bg: "bg-[#B7ADCF]",
      textColor: "text-[#2e2640]",
      mutedColor: "text-[#2e2640]/60",
      accentBg: "bg-[#9d91c0]",
      accentBg2: "bg-[#cfc9e3]",
      description:
        "Climb leaderboards and benchmark your skills against your friends.",
      stat: userCount,
      statLabel: "Active competitors",
      tag: "Rated matches",
      quote: "Every problem is a chance to outrank someone.",
      isShip: false,
    },
    {
      title: "Collaborate",
      bg: "bg-[#DEE7E7]",
      textColor: "text-[#1e2a2a]",
      mutedColor: "text-[#1e2a2a]/60",
      accentBg: "bg-[#c4d4d4]",
      accentBg2: "bg-[#eef3f3]",
      description:
        "Pair program in real time. Share a live session and solve problems together.",
      stat: "Real-time",
      statLabel: "Live coding sessions",
      tag: "Multiplayer",
      quote: "Two heads debug faster than one.",
      isShip: false,
    },
    {
      title: "Improve",
      bg: "bg-[#F4FAFF]",
      textColor: "text-[#1a1e2a]",
      mutedColor: "text-[#1a1e2a]/60",
      accentBg: "bg-[#daeaf7]",
      accentBg2: "bg-[#eef5fc]",
      description:
        "Track your growth with detailed analytics. Spot your weak spots and watch your rating climb.",
      stat: "↑ 38%",
      statLabel: "Avg. rating gain / month",
      tag: "Analytics",
      quote: "What gets measured gets mastered.",
      isShip: false,
    },
    {
      title: "Ship",
      bg: "bg-[#1a1a1b]",
      textColor: "text-white",
      mutedColor: "text-white/60",
      accentBg: "bg-[#2e2e30]",
      accentBg2: "bg-[#3a3a3d]",
      description: "",
      stat: "",
      statLabel: "",
      tag: "",
      quote: "",
      isShip: true,
    },
  ];

  return (
    <div className="relative bg-[#262728] h-[400vh]">
      {sections.map((section, i) =>
        section.isShip ? (
          <div
            key={section.title}
            className={`sticky ${tops[i]} ${zIndexes[i]} bg-[#1a1a1b] h-screen overflow-hidden flex flex-col`}
          >
            {/* title row */}
            <div className="flex items-center justify-between shrink-0 h-[80px] px-10">
              <h2 className="font-black tracking-tight m-0 text-[clamp(2rem,5vw,3.5rem)] text-white">
                JOIN
              </h2>
            </div>

            <div
              className="flex-1 px-6 pb-6 grid gap-3"
              style={{
                gridTemplateColumns: "1fr 1fr 1fr",
                gridTemplateRows: "1fr 1fr",
              }}
            >
              <div className="bg-[#2e2e30] rounded-2xl p-8 flex flex-col justify-between col-span-2 row-span-1">
                <div>
                  <p className="text-white/40 text-xs font-mono tracking-widest uppercase mb-3 m-0">
                    Pairleet
                  </p>
                  <h3 className="text-white text-4xl font-black tracking-tight leading-tight m-0">
                    Start competing.
                    <br />
                    Start practicing.
                  </h3>
                </div>
                <button
                  onClick={() => router.push("/sign-up")}
                  className="self-start bg-[#B7ADCF] text-[#2e2640] text-lg font-bold tracking-wide px-6 py-3 rounded-full hover:bg-white transition-colors duration-150 active:scale-95 cursor-pointer"
                >
                  Create account →
                </button>
              </div>

              <div className="bg-[#2e2e30] rounded-2xl p-6 flex flex-col justify-between col-span-1 row-span-1">
                <div>
                  <p className="text-white/40 text-xs font-mono tracking-widest uppercase mb-2 m-0">
                    Bugs / Contact
                  </p>
                  <p className="text-white/70 text-sm leading-relaxed m-0">
                    <span className="font-bold"> Something broken?</span>
                    <br />
                    Since Pairleet has just begun (As of June 2026) ,
                    <br />
                    You could expect a lot of bugs, But we are open to
                    correcting mistakes, so If you find any bug .
                    <br />
                    Just Text us or email us in any given Social. We will try to
                    fix it asap :) .{" "}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs font-mono tracking-widest uppercase mb-2 m-0">
                    Design/Reference
                  </p>
                  <p className="text-white/70 text-sm leading-relaxed m-0">
                    <br />
                    The Theme for Pairleet is Bento Grid UI
                    <br />A Lot of effects are taken from yt/@codegrid and a lot
                    of codepens and Dribbble ,pinterest and random sites. And
                    Color scheme is from Coolors.co.
                  </p>
                </div>
              </div>

              <div className="bg-[#2e2e30] rounded-2xl p-6 flex flex-col justify-between col-span-1 row-span-1">
                <p className="text-white/40 text-xs font-mono tracking-widest uppercase m-0 mb-4">
                  Cookies
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { name: "Synomia", url: "https://synomia.pages.dev/" },
                    {
                      name: "Orpheus",
                      url: "https://orpheus-omega.vercel.app/",
                    },
                    { name: "Texin", url: "https://texin.vercel.app/" },
                  ].map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/50 hover:text-white cursor-pointer transition-colors duration-150"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
                <p className="text-white/20 text-xs font-mono m-0 mt-4">
                  © 2026 Pairleet
                </p>
              </div>
              <a
                href="https://x.com/srrw2s"
                target="_blank"
                rel="noreferrer"
                className="bg-[#2e2e30] rounded-2xl p-6 flex flex-col justify-between col-span-1 row-span-1 hover:bg-[#3a3a3d] transition-colors duration-150 no-underline"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <div className="pointer-events-none">
                  <p className="text-white font-bold text-lg m-0 leading-none">
                    Follow us
                  </p>
                  <p className="text-white/40 text-xs font-mono m-0 mt-1">
                    @srrw2s
                  </p>
                </div>
              </a>

              <a
                href=""
                target="_blank"
                rel="noreferrer"
                className="bg-[#5865F2] rounded-2xl p-6 flex flex-col justify-between col-span-1 row-span-1 hover:bg-[#4752c4] transition-colors duration-150 no-underline"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <div className="pointer-events-none">
                  <p className="text-white font-bold text-lg m-0 leading-none">
                    Contact at Discord
                  </p>

                  <p className="text-white/60 text-xs font-mono m-0 mt-1 ">
                    @tiag3
                  </p>
                </div>
              </a>
            </div>
          </div>
        ) : (
          <div
            key={section.title}
            className={`sticky ${tops[i]} ${zIndexes[i]} ${section.bg} h-screen rounded-2xl overflow-hidden flex flex-col`}
          >
            <div className="flex items-center justify-between shrink-0 h-[80px] px-10">
              <h2
                className={`font-black tracking-tight m-0 text-[clamp(2rem,5vw,3.5rem)] ${section.textColor}`}
              >
                {section.title}
              </h2>
            </div>
            <div className="px-10 pb-5">
              <p
                className={`text-sm leading-relaxed max-w-sm m-0 ${section.mutedColor}`}
              >
                {section.description}
              </p>
            </div>
            <div className="flex-1 px-10 pb-10 grid grid-cols-3 grid-rows-2 gap-3">
              <div
                className={`${section.accentBg} rounded-xl p-5 flex flex-col gap-2 col-span-1 row-span-1`}
              >
                <span
                  className={`text-xs font-mono tracking-widest uppercase ${section.mutedColor}`}
                >
                  {section.statLabel}
                </span>
                <span
                  className={`text-4xl font-black tracking-tight leading-none ${section.textColor}`}
                >
                  {section.stat}
                </span>
              </div>
              <div
                className={`${section.accentBg2} rounded-xl p-6 flex items-center col-span-2 row-span-1`}
              >
                <p
                  className={`text-lg font-bold leading-snug m-0 ${section.textColor}`}
                >
                  "{section.quote}"
                </p>
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
