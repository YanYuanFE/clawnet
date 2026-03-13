import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  label: string;
}

interface Packet {
  from: number;
  to: number;
  progress: number;
  speed: number;
}

export default function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener("resize", resize);

    const TEAL = "#2dd4bf";
    const ZINC_600 = "#52525b";
    const ZINC_500 = "#71717a";

    const labels = ["Alpha", "Beta", "Gamma", "", "", "", "", "", "", "", "", ""];
    const nodes: Node[] = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: i < 3 ? 5 : 2.5,
      label: labels[i],
    }));

    const packets: Packet[] = [];
    let frameCount = 0;

    const spawnPacket = () => {
      if (packets.length >= 6) return;
      const from = Math.floor(Math.random() * 3);
      let to = Math.floor(Math.random() * nodes.length);
      if (to === from) to = (to + 1) % nodes.length;
      packets.push({ from, to, progress: 0, speed: 0.008 + Math.random() * 0.012 });
    };

    for (let i = 0; i < 3; i++) spawnPacket();

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    let animFrame: number;

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = ZINC_600;
            ctx.globalAlpha = 0.25 * (1 - dist / 200);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      // Packets
      for (const pkt of packets) {
        const a = nodes[pkt.from];
        const b = nodes[pkt.to];
        const x = a.x + (b.x - a.x) * pkt.progress;
        const y = a.y + (b.y - a.y) * pkt.progress;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = TEAL;
        ctx.fill();
      }

      // Nodes
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.label ? TEAL : ZINC_500;
        ctx.fill();

        if (node.label) {
          ctx.font = "500 9px 'JetBrains Mono', monospace";
          ctx.fillStyle = ZINC_500;
          ctx.textAlign = "center";
          ctx.fillText(node.label, node.x, node.y + node.radius + 12);
        }
      }
    };

    const animate = () => {
      if (!isVisible) {
        animFrame = requestAnimationFrame(animate);
        return;
      }

      frameCount++;
      if (frameCount % 90 === 0) spawnPacket();

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 20 || node.x > w() - 20) node.vx *= -1;
        if (node.y < 20 || node.y > h() - 20) node.vy *= -1;
      }

      for (let p = packets.length - 1; p >= 0; p--) {
        packets[p].progress += packets[p].speed;
        if (packets[p].progress >= 1) packets.splice(p, 1);
      }

      draw();
      animFrame = requestAnimationFrame(animate);
    };

    if (prefersReducedMotion) {
      draw();
    } else {
      animate();
    }

    return () => {
      cancelAnimationFrame(animFrame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
      aria-hidden="true"
    />
  );
}
