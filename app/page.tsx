"use client";

import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { useGiftStore, PRESET_COLORS, Gift } from "@/store/useGiftStore";

export default function GiftSpinner() {
  const {
    gifts,
    addGift: addGiftToStore,
    removeGift: removeGiftFromStore,
    decrementQuantity,
  } = useGiftStore();

  const [newGiftName, setNewGiftName] = useState("");
  const [newGiftQty, setNewGiftQty] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Gift | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<
    {
      id: number;
      left: string;
      color: string;
      delay: string;
      duration: string;
    }[]
  >([]);

  const currentRotationRef = useRef(0);

  // Audio Refs
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const tryAgainAudioRef = useRef<HTMLAudioElement | null>(null);
  const failAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    spinAudioRef.current = new Audio("/audio/slot.wav");
    winAudioRef.current = new Audio("/audio/win.wav");
    tryAgainAudioRef.current = new Audio("/audio/sad.wav");
    failAudioRef.current = new Audio("/audio/fail.wav");
  }, []);

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const triggerLocalConfetti = () => {
    const particles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      delay: `${Math.random() * 0.4}s`,
      duration: `${1.5 + Math.random() * 1.5}s`,
    }));
    setConfettiParticles(particles);

    setTimeout(() => setConfettiParticles([]), 3500);
  };

  // Play target sound track safely
  const playAudio = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        console.log("Audio waiting for explicit user gesture.");
      });
    }
  };

  const spinWheel = () => {
    const availableGifts = gifts.filter(
      (g) => g.quantity === -1 || g.quantity > 0,
    );

    if (isSpinning || availableGifts.length === 0) {
      alert("No available gifts left to win!");
      return;
    }

    setIsSpinning(true);
    setWinner(null);
    setIsModalOpen(false);

    playAudio(spinAudioRef);

    const randomAvailableIndex = Math.floor(
      Math.random() * availableGifts.length,
    );
    const winningGift = availableGifts[randomAvailableIndex];

    const winningIndexInFullArray = gifts.findIndex(
      (g) => g.id === winningGift.id,
    );

    const sliceAngle = 360 / gifts.length;
    const targetSliceCenter =
      winningIndexInFullArray * sliceAngle + sliceAngle / 2;
    const stopAngle = (360 - targetSliceCenter) % 360;

    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const baseRotation = Math.ceil(currentRotationRef.current / 360) * 360;
    const finalRotation = baseRotation + extraSpins + stopAngle;

    currentRotationRef.current = finalRotation;
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(winningGift);
      setIsModalOpen(true);

      decrementQuantity(winningGift.id);

      // Play contextual audio and triggers based on result
      const nameLower = winningGift.name.toLowerCase();

      if (nameLower.includes("try again")) {
        playAudio(tryAgainAudioRef);
      } else if (
        nameLower.includes("better luck next time") ||
        nameLower.includes("nothing")
      ) {
        playAudio(failAudioRef);
      } else {
        playAudio(winAudioRef);
        triggerLocalConfetti(); // Confetti on prize wins
      }
    }, 5500);
  };

  const handleAddGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGiftName.trim()) return;

    addGiftToStore(newGiftName, newGiftQty);
    setNewGiftName("");
    setNewGiftQty(10);
    resetWheel();
  };

  const handleRemoveGift = (id: string) => {
    if (gifts.length <= 2) {
      alert("You need at least 2 options to spin!");
      return;
    }
    removeGiftFromStore(id);
    resetWheel();
  };

  const resetWheel = () => {
    currentRotationRef.current = 0;
    setRotation(0);
    setWinner(null);
    setIsModalOpen(false);
  };

  const hasAvailableGifts = gifts.some(
    (g) => g.quantity === -1 || g.quantity > 0,
  );

  const isTryAgain = winner?.name.toLowerCase().includes("try again");
  const isLoss =
    winner?.name.toLowerCase().includes("better luck next time") ||
    winner?.name.toLowerCase().includes("nothing");

  return (
    <div className="w-full px-4 py-8 relative overflow-hidden min-h-screen bg-violet-50">
      <h1 className="text-5xl text-center capitalize font-black text-violet-800 mb-5">
        Spin and win awesome Prizes
      </h1>
      <div className=" flex justify-center items-center">
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {confettiParticles.map((p) => (
            <div
              key={p.id}
              className="absolute top-0 w-3 h-3 rounded-sm opacity-90 animate-[fall_3s_linear_infinite] z-50"
              style={{
                left: p.left,
                backgroundColor: p.color,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>

        <style jsx global>{`
          @keyframes fall {
            0% {
              transform: translateY(-20px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(105vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}</style>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 w-full max-w-7xl">
          <div className="rounded-2xl border border-purple-300 bg-purple-100 p-6 lg:col-span-3 ring-4 ring-white/60">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Win Prizes
            </h2>

            <form onSubmit={handleAddGift} className="mb-6 flex flex-col gap-2">
              <input
                type="text"
                value={newGiftName}
                onChange={(e) => setNewGiftName(e.target.value)}
                placeholder="Add new prize..."
                maxLength={30}
                disabled={isSpinning}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 disabled:opacity-50"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newGiftQty}
                  min={1}
                  onChange={(e) => setNewGiftQty(Number(e.target.value))}
                  placeholder="Qty"
                  disabled={isSpinning}
                  className="w-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSpinning || !newGiftName.trim()}
                  className="w-1/2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
              {gifts.map((gift) => {
                const isDisabled = gift.quantity === 0;

                return (
                  <div
                    key={gift.id}
                    className={`flex items-center justify-between rounded-lg border p-3 shadow-sm transition-colors ${
                      isDisabled
                        ? "bg-slate-100 border-slate-200 opacity-60"
                        : "bg-white border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-slate-200"
                        style={{
                          backgroundColor: isDisabled ? "#94A3B8" : gift.color,
                        }}
                      />
                      <div className="flex flex-col truncate">
                        <span
                          className={`font-bold text-xs truncate ${isDisabled ? "text-slate-400 line-through" : "text-slate-700"}`}
                        >
                          {gift.name}
                        </span>
                        <span
                          className={`text-[10px] font-medium ${isDisabled ? "text-rose-500 font-bold" : "text-slate-500"}`}
                        >
                          {gift.quantity === -1
                            ? "Infinite"
                            : isDisabled
                              ? "Out of Stock"
                              : `${gift.quantity} left`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGift(gift.id)}
                      disabled={isSpinning || gifts.length <= 2}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 disabled:opacity-30 cursor-pointer shrink-0 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center lg:col-span-6">
            <div className="relative h-80 w-80 md:h-[600px] md:w-[600px]">
              <div className="absolute -top-4 left-1/2 z-20 h-0 w-0 -translate-x-1/2 border-l-[16px] border-r-[16px] border-t-[32px] border-l-transparent border-r-transparent border-t-rose-600 drop-shadow-md" />

              <div className="relative h-full w-full rounded-full border-8 border-white bg-white p-2 shadow-2xl">
                <div
                  className="h-full w-full rounded-full overflow-hidden"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning
                      ? "transform 5000ms cubic-bezier(0.15, 0.15, 0.8, 1)"
                      : "none",
                  }}
                >
                  <svg viewBox="-1 -1 2 2" className="h-full w-full -rotate-90">
                    {gifts.map((gift, index) => {
                      const isDisabled = gift.quantity === 0;
                      const slicePercent = 1 / gifts.length;
                      const startPercent = index * slicePercent;
                      const endPercent = (index + 1) * slicePercent;

                      const [startX, startY] =
                        getCoordinatesForPercent(startPercent);
                      const [endX, endY] = getCoordinatesForPercent(endPercent);
                      const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

                      const midPercent = startPercent + slicePercent / 2;
                      const textAngleRad = 2 * Math.PI * midPercent;

                      const textX = Math.cos(textAngleRad) * 0.65;
                      const textY = Math.sin(textAngleRad) * 0.65;

                      let labelRotation = midPercent * 360;
                      if (labelRotation > 90 && labelRotation < 270) {
                        labelRotation += 180;
                      }

                      return (
                        <g
                          key={gift.id}
                          className={isDisabled ? "opacity-30" : "opacity-100"}
                        >
                          <path
                            d={`M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                            fill={isDisabled ? "#94A3B8" : gift.color}
                            className="stroke-white stroke-[0.005]"
                          />
                          <text
                            x={textX}
                            y={textY}
                            fill="#ffffff"
                            fontSize="0.045"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${labelRotation}, ${textX}, ${textY})`}
                            className="font-sans select-none"
                          >
                            {isDisabled
                              ? `${gift.name} (Out)`
                              : gift.name.length > 18
                                ? gift.name.slice(0, 16) + "..."
                                : gift.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 m-auto size-20 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center">
                    <img src="/image/logo.png" alt="Logo" />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={spinWheel}
              disabled={isSpinning || !hasAvailableGifts}
              className="mt-8 w-64 rounded-full bg-purple-700 px-8 py-4 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer disabled:cursor-not-allowed"
            >
              {isSpinning
                ? "Spinning..."
                : hasAvailableGifts
                  ? "SPIN!"
                  : "OUT OF STOCK"}
            </button>
          </div>

          <div className="col-span-3 bg-center flex justify-center items-center">
            <Image
              src="/image/bg.png"
              height={250}
              width={250}
              alt=""
              className="w-full"
            />
          </div>
        </div>

        {isModalOpen && winner && (
          <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => resetWheel()}
            />

            <div className="relative w-full max-w-xl min-h-[50vh] flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-white via-slate-50/90 to-emerald-50/70 p-8 sm:p-10 text-center shadow-2xl ring-1 ring-slate-900/5 transition-all">
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 opacity-70 blur-md animate-pulse" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-100 to-emerald-50 text-5xl shadow-inner border border-emerald-200/60">
                    {isLoss ? "😢" : isTryAgain ? "🔄" : "🎉"}
                  </div>
                </div>

                <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-700 ring-1 ring-inset ring-amber-500/20">
                  {isLoss
                    ? "Better Luck Next Time"
                    : isTryAgain
                      ? "Extra Spin"
                      : "Exclusive Reward"}
                </span>

                <h3 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {isLoss
                    ? "Hard Luck!"
                    : isTryAgain
                      ? "Spin Again!"
                      : "Congratulations!"}
                </h3>

                <p className="mt-2 text-base text-slate-600 font-medium max-w-sm">
                  The spinner selected:
                </p>

                <div className="mt-6 w-full rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/80 py-6 px-4 shadow-sm backdrop-blur-sm">
                  <div className="inline-flex items-center justify-center gap-3">
                    <span
                      className="h-4 w-4 rounded-full ring-4 ring-white shadow-sm shrink-0"
                      style={{ backgroundColor: winner.color }}
                    />
                    <span className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-wide drop-shadow-sm">
                      {winner.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-8">
                <button
                  type="button"
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 py-4 px-6 text-base font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer"
                  onClick={() => resetWheel()}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isTryAgain ? "Spin Now ➔" : "Awesome ➔"}
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
