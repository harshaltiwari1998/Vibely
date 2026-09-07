import { useState } from "react";

type Task = { icon: string; title: string; reward: string; action: "GO" | "Expand" | "Received"; detail?: string };

const taskGroups: { title: string; tasks: Task[] }[] = [
  {
    title: "Daily rewards",
    tasks: [
      { icon: "◌", title: "Give gifts in a live room", reward: "Card x1", action: "GO" },
      { icon: "▣", title: "Watch a reward video", reward: "Diamond x10", action: "GO", detail: "1 of 3 videos watched today" },
    ],
  },
  {
    title: "Milestones",
    tasks: [
      { icon: "◌", title: "Accumulate gifts", reward: "Diamond x1.0K", action: "Expand", detail: "Send gifts to unlock your next reward" },
      { icon: "◉", title: "Accumulate game investment", reward: "Diamond x6.5K", action: "Expand", detail: "Play featured games to earn progress" },
      { icon: "□", title: "Accumulate login", reward: "Card x4", action: "Expand", detail: "Log in on more days to complete this task" },
    ],
  },
  {
    title: "Account rewards",
    tasks: [
      { icon: "▤", title: "Modify nickname", reward: "Card x1", action: "Received" },
      { icon: "▤", title: "Change avatar", reward: "Card x1", action: "Received" },
      { icon: "◉", title: "Play a game", reward: "Card x1", action: "Received" },
    ],
  },
];

export function TaskCenterPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());

  const performAction = (task: Task) => {
    if (task.action === "Expand") {
      setExpanded(expanded === task.title ? null : task.title);
    }
    if (task.action === "GO") {
      setClaimed((current) => new Set(current).add(task.title));
    }
  };

  return (
    <section className="mx-auto -mt-5 max-w-3xl pb-4">
      <div className="bg-gradient-to-br from-[#6717e8] via-[#c116ff] to-[#f146d9] px-4 pb-9 pt-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">Jholamet rewards</p>
        <h1 className="mt-2 text-4xl font-black italic">TASK CENTER</h1>
        <p className="mt-2 max-w-md text-sm text-white/85">Complete simple daily activities and collect rewards.</p>
      </div>
      <div className="-mt-5 space-y-4 px-3">
        {taskGroups.map((group) => (
          <section key={group.title} className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5">
            <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-bold text-gray-500">{group.title}</h2>
            {group.tasks.map((task) => {
              const isClaimed = claimed.has(task.title) || task.action === "Received";
              const isExpanded = expanded === task.title;
              return (
                <div key={task.title} className="border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5eeff] text-xl font-bold text-[#8b42ed]">{task.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{task.title}</p>
                      <p className="mt-0.5 text-sm font-bold text-[#d11ae5]">{task.reward}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isClaimed}
                      onClick={() => performAction(task)}
                      className={`min-w-20 rounded-full px-4 py-2 text-sm font-bold transition ${isClaimed ? "bg-gray-100 text-gray-400" : "bg-gradient-to-r from-[#e445f4] to-[#8a5af5] text-white shadow-sm"}`}
                    >
                      {isClaimed ? "Received" : task.action}
                    </button>
                  </div>
                  {isExpanded && task.detail && <p className="mx-5 mb-4 rounded-md bg-[#faf7ff] px-3 py-2 text-sm text-gray-600">{task.detail}</p>}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </section>
  );
}