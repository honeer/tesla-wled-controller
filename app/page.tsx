// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Lamp, Car, Settings } from "lucide-react";

type NavTileProps = {
  href: string;
  title: string;
  subtitle?: string;
  imageSrc: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function NavTile({ href, title, subtitle, imageSrc, Icon }: NavTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border",
        // Big tappable tiles (Tesla-friendly)
        "h-[190px] sm:h-[220px] md:h-[260px]",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
    >
      <Image
        src={imageSrc}
        alt={title}
        fill
        priority={false}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />

      {/* Dim overlay for contrast */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Blurred area where text sits */}
      <div className="absolute left-0 right-0 bottom-0 p-5 bg-black/35 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <Icon className="h-6 w-6 text-white" />
          </div>

          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-semibold text-white leading-tight">
              {title}
            </div>
            {subtitle ? (
              <div className="text-sm sm:text-base text-white/80 truncate">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function StartPage() {
  return (
    <main className="min-h-[100svh] px-6">
      {/* Center everything vertically */}
      <div className="mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <div className="relative h-20 w-56 sm:h-24 sm:w-72">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* 3 tiles in one row */}
        <div className="grid gap-6 md:grid-cols-3">
          <NavTile
            href="/wled"
            title="Ambient Lights"
            subtitle="Interior LEDs"
            imageSrc="/tiles/ambient.jpg"
            Icon={Lamp}
          />

          <NavTile
            href="/exterior-lights"
            title="Exterior Lights"
            subtitle="Fog lights"
            imageSrc="/tiles/exterior.jpg"
            Icon={Car}
          />

          <NavTile
            href="/wled?settings=1"
            title="Settings"
            subtitle="Connect devices"
            imageSrc="/tiles/settings.jpg"
            Icon={Settings}
          />
        </div>
      </div>
    </main>
  );
}
