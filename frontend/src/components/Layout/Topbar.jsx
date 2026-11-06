import React from 'react'
import { TbBrandMeta } from "react-icons/tb";
import { IoLogoInstagram } from "react-icons/io";
import { RiTwitterXLine } from "react-icons/ri";

const Topbar = () => {
  return (
    <div className="bg-ink text-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-2 text-[13px]">
            <div className="hidden md:flex items-center gap-4 text-white/70">
                <a href="#" aria-label="Meta" className="transition-colors hover:text-white">
                    <TbBrandMeta className="h-4 w-4" />
                </a>
                <a href="#" aria-label="Instagram" className="transition-colors hover:text-white">
                    <IoLogoInstagram className="h-4 w-4" />
                </a>
                <a href="#" aria-label="X" className="transition-colors hover:text-white">
                    <RiTwitterXLine className="h-3.5 w-3.5" />
                </a>
            </div>
            <p className="grow text-center tracking-wide">
                We ship worldwide - fast and reliable shipping!
            </p>
            <div className="hidden md:block w-[76px]" aria-hidden="true" />
        </div>
    </div>
  )
}

export default Topbar