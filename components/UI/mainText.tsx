"use client";
import { useEffect, useRef } from "react";

interface Cell {
  col: number;
  row: number;
  char: string;
  isLit: boolean;
  offsetX: number;
  offsetY: number;
  velX: number;
  velY: number;
}

export default function AsciiHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    const dpr = window.devicePixelRatio || 1;

    let CELL_SIZE = 8;
    let CELL_GAP = 2;
    let CELL_STEP = 10;

    const GRID_COLOR = "#B7ADCF"; // matches card bg — dots are invisible, purple shows through
    const CHAR_COLOR = "#ffffff"; // white chars on purple
    const ASCII_CHARS = " .:;+*#%@";
    const THRESHOLD = 0.3;
    const PUSH_RADIUS = 5;
    const PUSH_FORCE = 30;
    const SPRING = 0.025;
    const DAMPING = 0.5;

    let cols = 0;
    let rows = 0;
    let cells: Cell[] = [];
    let mouse = { col: -999, row: -999, isMoving: false };
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId = 0;
    let scrambleId: ReturnType<typeof setInterval>;
    let started = false;

    function getParentSize() {
      const parent = canvas.parentElement!;
      return {
        W: parent.clientWidth,
        H: parent.clientHeight,
      };
    }

    function setupCanvas() {
      const { W, H } = getParentSize();

      CELL_SIZE = W < 768 ? 4 : 7;
      CELL_GAP = W < 768 ? 1 : 0;
      CELL_STEP = CELL_SIZE + CELL_GAP;
      cols = Math.floor(W / CELL_STEP);
      rows = Math.floor(H / CELL_STEP);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function buildSourceCanvas(): HTMLCanvasElement {
      const { W: canvasW, H: canvasH } = getParentSize();

      const logoImg = document.getElementById(
        "ascii-logo-source",
      ) as HTMLImageElement | null;

      const off = document.createElement("canvas");
      const W = Math.round(canvasW * 0.7);
      const H =
        logoImg && logoImg.naturalHeight > 0
          ? Math.round(W * (logoImg.naturalHeight / logoImg.naturalWidth))
          : Math.round(W * 0.22);

      off.width = W;
      off.height = H;
      const oc = off.getContext("2d")!;

      oc.fillStyle = "#fff";
      oc.fillRect(0, 0, W, H);

      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        oc.drawImage(logoImg, 0, 0, W, H);
      } else {
        oc.fillStyle = "#000";
        const fontSize = Math.floor(H * 0.72);
        oc.font = `bold ${fontSize}px 'Arial Black', Arial, sans-serif`;
        oc.textBaseline = "middle";
        oc.textAlign = "center";
        oc.fillText("PAIRLEET", W / 2, H / 2);
      }

      return off;
    }

    function sampleLogoIntoCells() {
      const src = buildSourceCanvas();
      const logoW = src.width;
      const logoH = src.height;

      const { W: canvasW, H: canvasH } = getParentSize();

      const startX = Math.floor((canvasW - logoW) / 2);
      const startY = Math.floor((canvasH - logoH) / 2);

      const logoCols = Math.ceil(logoW / CELL_STEP);
      const logoRows = Math.ceil(logoH / CELL_STEP);
      const startCol = Math.floor(startX / CELL_STEP);
      const startRow = Math.floor(startY / CELL_STEP);

      const sc = document.createElement("canvas");
      sc.width = logoCols;
      sc.height = logoRows;
      const sx = sc.getContext("2d")!;
      sx.drawImage(src, 0, 0, logoCols, logoRows);
      const { data } = sx.getImageData(0, 0, logoCols, logoRows);

      cells = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const inLogo =
            col >= startCol &&
            col < startCol + logoCols &&
            row >= startRow &&
            row < startRow + logoRows;

          let isLit = false;
          let char = " ";

          if (inLogo) {
            const idx = ((row - startRow) * logoCols + (col - startCol)) * 4;
            const r = data[idx],
              g = data[idx + 1],
              b = data[idx + 2],
              a = data[idx + 3];
            const brightness =
              ((r * 0.299 + g * 0.587 + b * 0.114) / 255) * (a / 255);

            const darkness = 1 - brightness;
            isLit = darkness > THRESHOLD;

            char = isLit
              ? ASCII_CHARS[
                  Math.min(
                    ASCII_CHARS.length - 1,
                    Math.floor(darkness * ASCII_CHARS.length),
                  )
                ]
              : " ";
          }

          cells.push({
            col,
            row,
            char,
            isLit,
            offsetX: 0,
            offsetY: 0,
            velX: 0,
            velY: 0,
          });
        }
      }
    }

    function renderFrame() {
      const { W, H } = getParentSize();
      ctx.font = `${CELL_SIZE + 2}px monospace`;
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = GRID_COLOR;
      for (const { col, row } of cells)
        ctx.fillRect(col * CELL_STEP, row * CELL_STEP, CELL_SIZE, CELL_SIZE);

      ctx.fillStyle = CHAR_COLOR;
      for (const cell of cells) {
        if (!cell.isLit) continue;
        const x = (cell.col + Math.round(cell.offsetX)) * CELL_STEP;
        const y = (cell.row + Math.round(cell.offsetY)) * CELL_STEP;
        ctx.fillText(cell.char, x + CELL_SIZE / 2, y);
      }
    }

    function updatePhysics() {
      for (const cell of cells) {
        if (!cell.isLit) continue;

        if (mouse.isMoving) {
          const dx = cell.col + cell.offsetX - mouse.col;
          const dy = cell.row + cell.offsetY - mouse.row;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < PUSH_RADIUS && dist > 0) {
            const force = (1 - dist / PUSH_RADIUS) ** 2 * PUSH_FORCE;
            cell.velX += (dx / dist) * force;
            cell.velY += (dy / dist) * force;
          }
        }

        cell.velX += -cell.offsetX * SPRING;
        cell.velY += -cell.offsetY * SPRING;
        cell.velX *= DAMPING;
        cell.velY *= DAMPING;
        cell.offsetX += cell.velX;
        cell.offsetY += cell.velY;

        if (Math.abs(cell.offsetX) < 0.01 && Math.abs(cell.velX) < 0.01) {
          cell.offsetX = 0;
          cell.velX = 0;
        }
        if (Math.abs(cell.offsetY) < 0.01 && Math.abs(cell.velY) < 0.01) {
          cell.offsetY = 0;
          cell.velY = 0;
        }
      }
    }

    function animationLoop() {
      updatePhysics();
      renderFrame();
      rafId = requestAnimationFrame(animationLoop);
    }

    function init() {
      setupCanvas();
      sampleLogoIntoCells();

      if (!started) {
        started = true;
        animationLoop();
      }
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouse.col = (e.clientX - rect.left) / CELL_STEP;
      mouse.row = (e.clientY - rect.top) / CELL_STEP;
      mouse.isMoving = true;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        mouse.isMoving = false;
      }, 50);
    }

    function onMouseLeave() {
      mouse.col = -999;
      mouse.row = -999;
      mouse.isMoving = false;
    }

    function onResize() {
      setupCanvas();
      sampleLogoIntoCells();
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", onResize);

    requestAnimationFrame(init);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(scrambleId);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div ref={wrapRef} className="sr-only">
        <img
          id="ascii-logo-source"
          src="/logo.png"
          alt=""
          style={{ visibility: "hidden", position: "absolute" }}
        />
      </div>
    </section>
  );
}
