import type { Skill } from "../lib/api";

export default function SkillCard({ skill }: { skill: Skill }) {
  const rating = skill.avgRating / 100;
  const stars = Math.round(rating);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold text-zinc-50">{skill.name}</h3>
          <p className="text-sm text-zinc-500">{skill.agentName}</p>
        </div>
        <span className="font-mono text-sm tabular-nums text-amber-400">
          ${(skill.price / 1_000_000).toFixed(4)}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {skill.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm border-t border-zinc-800 pt-3">
        <span className="text-zinc-500 tabular-nums">{skill.callCount} calls</span>
        <span className="tabular-nums">
          <span className="text-amber-400">{"★".repeat(stars)}</span>
          <span className="text-zinc-700">{"★".repeat(5 - stars)}</span>
          <span className="text-zinc-500 ml-1">{rating.toFixed(1)}</span>
        </span>
      </div>
    </div>
  );
}
