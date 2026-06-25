"use client";
import AsciiHero from "@/components/UI/mainText";
import SecondPage from "@/components/UI/SecondPage";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Home() {
  const router = useRouter();
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMove = (e: MouseEvent) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    };

    const onEnterP = () => cursor.classList.add("cursor-expanded");
    const onLeaveP = () => cursor.classList.remove("cursor-expanded");
    const onEnterI = () => cursor.classList.add("cursor-expanded-image");
    const onLeaveI = () => cursor.classList.remove("cursor-expanded-image");

    document.addEventListener("mousemove", onMove);

    const pTags = document.querySelectorAll("p");
    pTags.forEach((p) => {
      p.addEventListener("mouseenter", onEnterP);
      p.addEventListener("mouseleave", onLeaveP);
    });

    const illusTags = Array.from(document.getElementsByClassName("illus"));
    illusTags.forEach((illus) => {
      illus.addEventListener("mouseenter", onEnterI);
      illus.addEventListener("mouseleave", onLeaveI);
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
      pTags.forEach((p) => {
        p.removeEventListener("mouseenter", onEnterP);
        p.removeEventListener("mouseleave", onLeaveP);
      });
      illusTags.forEach((illus) => {
        illus.removeEventListener("mouseenter", onEnterI);
        illus.removeEventListener("mouseleave", onLeaveI);
      });
    };
  }, []);

  return (
    <div>
      <main className="min-h-screen p-3 bg-[#262728] flex flex-row">
        <style>{`
        @media (hover: none), (pointer: coarse) {
          body { cursor: auto !important; }
          * { cursor: auto !important; }
          #custom-cursor { display: none; }
        }

        @media (hover: hover) and (pointer: fine) {
          * { cursor: none !important; }
        }

        #custom-cursor {
          position: fixed;
          width: 20px;
          height: 20px;
          border: 2px solid grey;
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%);
          transition: width 0.3s ease, height 0.3s ease, border 0.3s ease;
          z-index: 9999;
        }

        #custom-cursor.cursor-expanded {
          width: 80px;
          height: 80px;
          border: 2px dashed #B7ADCF;
          background-color: rgba(183, 173, 207, 0.25);
          animation: spin 5s linear infinite;
        }

        #custom-cursor.cursor-expanded-image {
          width: 120px;
          height: 120px;
          border: 2px dashed #B7ADCF;
          background-color: rgba(183, 173, 207, 0.14);
          -webkit-backdrop-filter: grayscale(1) saturate(0);
          backdrop-filter: grayscale(1) saturate(0);
          animation: spin 5s linear infinite;
        }

        @keyframes spin {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>

        <div id="custom-cursor" ref={cursorRef} />

        <div className="w-full grid grid-cols-2 grid-rows-[minmax(280px,auto)_auto] gap-3">
          {/* Hero card */}
          <div className="flex flex-col min-h-[400px] items-center justify-center col-span-2 bg-[#B7ADCF] rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0">
              <AsciiHero />
            </div>

            <div className="absolute bottom-6 left-10 z-10">
              <p className="text-white/90 text-sm font-mono tracking-widest uppercase leading-relaxed">
                Join sessions.
                <br />
                Solve problems.
                <br />
                <span className="relative text-white font-bold text-base tracking-wider after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-0 after:bg-white after:transition-all after:duration-500 hover:after:w-full cursor-default">
                  Improve together.
                </span>
              </p>
            </div>

            <div className="absolute bottom-4 right-10 z-10">
              <button
                onClick={() => router.push("/sign-up")}
                className="bg-[#F4FAFF] text-[#B7ADCF] hover:text-[#F4FAFF] hover:bg-[#807898] text-lg font-bold tracking-wide px-5 py-2.5 rounded-full cursor-pointer transition-colors duration-150 active:scale-95"
              >
                Start Now
              </button>
            </div>
          </div>

          <div className="bg-[#DEE7E7] rounded-2xl p-8 flex flex-col justify-between min-h-[220px] overflow-hidden relative">
            <div
              className="w-15 h-10 bg-[#4F646F]"
              style={{
                maskImage: "url('/swords.svg')",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskImage: "url('/swords.svg')",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
              }}
            />
            <div className="mb-13">
              <p className="text-3xl font-extrabold text-[#1e2a2a] mb-2 leading-tight">
                Competitive
              </p>
              <p className="text-xs text-[#3d5050]/70 leading-relaxed">
                Climb leaderboards and challenge your peers.
              </p>
            </div>
            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-[#4F646F]/10 pointer-events-none" />
          </div>

          <div className="bg-[#F4FAFF] rounded-2xl p-8 flex flex-col justify-between min-h-[220px] overflow-hidden relative">
            <div
              className="w-10 h-10 bg-[#B7ADCF]"
              style={{
                maskImage: "url('/users-round.svg')",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskImage: "url('/users-round.svg')",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
              }}
            />
            <div>
              <p className="text-3xl font-extrabold text-[#1a1e2a] mb-2 leading-tight">
                Collaborative
              </p>
              <p className="text-xs text-[#3d5050]/70 leading-relaxed mb-5">
                Solve coding challenges together in real time.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-[#B7ADCF] text-white text-lg font-bold tracking-wide px-5 py-2.5 rounded-full cursor-pointer transition-all duration-150 hover:text-[#B7ADCF] hover:bg-white active:scale-95 inline-block"
              >
                Go to Dashboard →
              </button>
            </div>
            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-[#B7ADCF]/20 pointer-events-none" />
          </div>
        </div>
      </main>

      <div data-reveal style={{ transitionDelay: "120ms" }}>
        <SecondPage />
      </div>
    </div>
  );
}
