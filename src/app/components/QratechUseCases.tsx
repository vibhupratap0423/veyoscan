"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import React, { useMemo, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiTruck,
  FiPhoneCall,
  FiUsers,
  FiHeart,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";

type UseCase = {
  title: string;
  icon: React.ReactNode;
  desc: string;
  video?: string;
  img?: string;
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.5, delay },
});

export default function VeyoscanUseCases({
  useCases,
  title = "Real-Life Use Cases of Veyoscan",
  subtitle = `Transforming everyday situations into safer, smarter, and more connected experiences —
from emergencies to simple parking interactions.`,
}: {
  useCases?: UseCase[];
  title?: string;
  subtitle?: string;
}) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const defaultUseCases: UseCase[] = useMemo(
    () => [
      {
        title: "Emergency Assistance",
        icon: (
          <FiAlertTriangle
            className="text-cyan-300"
            size={24}
            aria-hidden="true"
          />
        ),
        desc: "A tragic accident occurs on the road. A bystander scans the vehicle’s Veyoscan QR tag and instantly connects with the driver’s family or emergency contact — saving crucial minutes.",
        video: "/Untitled design.mp4",
      },
      {
        title: "Parking Conflict",
        icon: (
          <FiTruck
            className="text-cyan-300"
            size={24}
            aria-hidden="true"
          />
        ),
        desc: "Someone accidentally parks behind your car. Instead of honking or wasting time, they simply scan your Veyoscan QR code and send a polite message or call instantly.",
        img: "/images/wrong parking.jpg",
      },
      {
        title: "Lost Belongings",
        icon: (
          <FiPhoneCall
            className="text-cyan-300"
            size={24}
            aria-hidden="true"
          />
        ),
        desc: "You left your phone, wallet, or helmet in a café. The finder scans your Veyoscan QR tag and reaches you without needing to reveal personal numbers or apps.",
        img: "/images/lost2.png",
      },
      {
        title: "Community Safety",
        icon: (
          <FiUsers
            className="text-cyan-300"
            size={24}
            aria-hidden="true"
          />
        ),
        desc: "Neighborhood watch or local groups can use Veyoscan stickers on gates, bikes, and devices — building quick, private communication between citizens and owners.",
        img: "/images/home.jpg",
      },
      {
        title: "Medical Emergency",
        icon: (
          <FiHeart
            className="text-cyan-300"
            size={24}
            aria-hidden="true"
          />
        ),
        desc: "A patient’s Veyoscan health QR tag shows blood group, emergency number, and allergy info — allowing faster first aid and accurate hospital coordination.",
        img: "/images/emergency.jpg",
      },
    ],
    []
  );

  const items = useCases ?? defaultUseCases;

  return (
    <section className="relative overflow-hidden bg-[#0a0f1a] text-white">
      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-12 text-center">
        <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.02em] leading-tight">
          <span className="bg-gradient-to-b from-cyan-300 to-white bg-clip-text text-transparent">
            {title}
          </span>
        </h2>

        <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-20 space-y-32">
        {items.map((u, i) => (
          <motion.div
            key={u.title}
            {...fadeUp(i * 0.08)}
            className={`relative flex flex-col lg:flex-row items-center gap-10 ${
              i % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            <motion.div
              className="relative flex-1 overflow-hidden rounded-2xl border border-cyan-400/20 shadow-[0_0_30px_rgba(34,211,238,0.1)] bg-black"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.35 }}
            >
              {u.video ? (
                <VideoPlayer
                  src={u.video}
                  isMuted={isMuted}
                  toggleMute={toggleMute}
                  videoRef={videoRef}
                />
              ) : (
                <div className="relative flex items-center justify-center max-h-[380px] w-full">
                  <Image
                    src={u.img || "/whitebglogo.png"}
                    alt={u.title}
                    width={500}
                    height={380}
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-contain h-full w-full rounded-2xl"
                  />
                </div>
              )}
            </motion.div>

            <div className="flex-1 space-y-4 lg:sticky lg:top-32">
              <div className="flex items-center gap-2 text-cyan-300 text-lg">
                {u.icon}
                <span className="font-semibold">{u.title}</span>
              </div>

              <h3 className="text-2xl font-extrabold tracking-[-0.02em]">
                {u.title}
              </h3>

              <p className="text-white/80 leading-relaxed text-base">
                {u.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function VideoPlayer({
  src,
  isMuted,
  toggleMute,
  videoRef,
}: {
  src: string;
  isMuted: boolean;
  toggleMute: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const playVideo = async () => {
    const video = videoRef.current;
    if (!video) return;

    setStarted(true);
    setLoading(true);

    try {
      setTimeout(async () => {
        try {
          video.load();
          await video.play();
        } catch {
          // browser block ignore
        } finally {
          setLoading(false);
        }
      }, 0);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-[260px] bg-black rounded-2xl overflow-hidden">
      <video
        ref={videoRef}
        src={started ? src : undefined}
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        onCanPlay={() => setLoading(false)}
        className="rounded-2xl object-cover w-full h-full min-h-[260px]"
      />

      {!started ? (
        <button
          type="button"
          onClick={playVideo}
          aria-label="Play VeyoScan use case video"
          title="Play video"
          className="absolute inset-0 flex items-center justify-center bg-black/70 text-white"
        >
          <span className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-black shadow-lg transition hover:brightness-110 active:scale-95">
            ▶ Play Video
          </span>
        </button>
      ) : null}

      {loading && started ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
          Loading video...
        </div>
      ) : null}

      {started ? (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          title={isMuted ? "Unmute video" : "Mute video"}
          className="absolute bottom-3 right-3 p-3 bg-black/60 rounded-full border border-cyan-400/30 hover:bg-cyan-400/20 transition"
        >
          {isMuted ? (
            <FiVolumeX className="text-white" size={18} aria-hidden="true" />
          ) : (
            <FiVolume2
              className="text-cyan-300"
              size={18}
              aria-hidden="true"
            />
          )}
        </button>
      ) : null}
    </div>
  );
}