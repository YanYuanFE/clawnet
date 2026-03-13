import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { api, Skill } from "../lib/api";
import SkillCard from "../components/SkillCard";
import { CardSkeleton } from "../components/Skeleton";

export default function SkillBrowser() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "rating" | "calls">("calls");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSkills().then((s) => {
      setSkills(s);
      setLoading(false);
    });
  }, []);

  const filtered = skills
    .filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "rating") return b.avgRating - a.avgRating;
      return b.callCount - a.callCount;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-zinc-50">Skills</h1>
          <p className="text-sm text-zinc-500 mt-1 tabular-nums">
            {skills.length} registered on-chain
          </p>
        </div>
        <div className="flex gap-1">
          {(["calls", "rating", "price"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm capitalize transition-colors",
                sortBy === s
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        placeholder="Search by name or tag\u2026"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-50 placeholder-zinc-600 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
      />

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-500 text-pretty">
            {search ? "No skills match your search." : "No skills registered yet."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((skill) => (
            <SkillCard key={`${skill.agentId}-${skill.skillId}`} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}
