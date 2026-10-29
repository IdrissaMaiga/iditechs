import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { socials, type SocialName } from "@/lib/company";

const icons: Record<SocialName, IconType> = {
  Instagram: FaInstagram,
  TikTok: FaTiktok,
  X: FaXTwitter,
  YouTube: FaYoutube,
  Facebook: FaFacebookF,
  LinkedIn: FaLinkedinIn,
};

type Props = {
  variant?: "icons" | "pills";
  size?: number;
  className?: string;
};

export function SocialLinks({ variant = "icons", size = 16, className = "" }: Props) {
  const item =
    variant === "pills"
      ? "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-200 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-white"
      : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-gray-300 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-white";

  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {socials.map((s) => {
        const Icon = icons[s.name];
        return (
          <li key={s.name}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${s.name} ${s.handle}`}
              title={`${s.name} · ${s.handle}`}
              className={item}
            >
              <Icon size={size} aria-hidden />
              {variant === "pills" && <span>{s.name}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
