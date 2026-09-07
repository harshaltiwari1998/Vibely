import { useState } from "react";

const invitationCode = "AV5LZF";

export function InvitationPage() {
  const [copied, setCopied] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard?.writeText(invitationCode);
    setCopied(true);
  };

  return (
    <section className="mx-auto -mt-5 max-w-3xl overflow-hidden bg-white pb-8">
      <div className="bg-gradient-to-b from-[#ff563b] via-[#ffac27] to-[#ffe17c] px-5 pb-28 pt-9 text-center text-white">
        <p className="text-sm font-bold uppercase tracking-[0.15em]">Jholamet Live</p>
        <h1 className="mt-2 text-4xl font-black">Invite Rewards</h1>
        <p className="mt-3 text-sm font-medium text-white/90">Invite friends. Share the rewards.</p>
      </div>
      <div className="-mt-20 px-4">
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-white/60 p-3 backdrop-blur">
          <div className="rounded-md bg-[#faf4ff] p-4 text-center shadow-sm">
            <p className="text-4xl font-black text-[#342a3b]">0%</p>
            <p className="mt-3 text-sm leading-5 text-gray-600">Earn up to <span className="font-bold text-[#ff6132]">8%</span> of each friend's recharge</p>
          </div>
          <div className="rounded-md bg-[#fff8e8] p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-[#342a3b]">Card x10</p>
            <p className="mt-4 text-sm leading-5 text-gray-600">For every friend you invite</p>
          </div>
        </div>
        <div className="mt-7 text-center">
          <h2 className="text-2xl font-black text-gray-900">Your invitation code</h2>
          <button type="button" onClick={copyCode} className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#fff0a0] to-[#fffaf0] px-5 py-5 text-3xl font-black tracking-[0.12em] text-[#ff6417] shadow-sm">
            {copied ? "COPIED" : invitationCode}
          </button>
          <p className="mt-4 text-sm text-[#ae75df]">New friends can enter the code within 3 days of registering.</p>
          <button type="button" onClick={() => setRulesOpen(!rulesOpen)} className="mt-5 rounded-full bg-gradient-to-r from-[#d94ef3] to-[#9345ed] px-8 py-3 font-bold text-white">
            {rulesOpen ? "Hide rules" : "View rules"}
          </button>
        </div>
        {rulesOpen && (
          <div className="mt-6 rounded-lg bg-[#fff8dc] p-5 text-sm leading-6 text-gray-700">
            <h2 className="text-lg font-bold text-gray-900">Recharge commission rewards</h2>
            <p className="mt-2">Your reward is based on your invited friends' completed recharges.</p>
            <div className="mt-4 divide-y divide-[#ead99b] rounded-md border border-[#ead99b] bg-white/70">
              {["Less than 60,500 diamonds: 0%", "60,500 to 2,755,500 diamonds: 3%", "2,755,500 to 11,005,500 diamonds: 5%", "More than 11,005,500 diamonds: 8%"].map((rule) => <p key={rule} className="px-3 py-2">{rule}</p>)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}