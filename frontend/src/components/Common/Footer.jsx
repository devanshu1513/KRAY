import React from "react";
import { Link } from "react-router";
import { TbBrandMeta } from "react-icons/tb";
import { IoLogoInstagram } from "react-icons/io5";
import { RiTwitterXLine } from "react-icons/ri";
import { FiPhoneCall } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-ink text-white/70 py-14">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4 lg:px-8">
        <div>
          <h3 className="font-display text-lg font-semibold text-white mb-4">Newsletter</h3>
          <p className="text-white/60 mb-4">
            Be the first to hear about our new products, exclusive events, and
            online offers!
          </p>
          <p className="font-medium text-sm text-white/80 mb-6">Sign up and get 10% off on your first order!</p>

          {/* Newsletter form */}
          <form className="flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-0 flex-1 rounded-l-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/50 transition-all focus:outline-none focus:ring-2 focus:ring-rabbit-red"
              required
            />
            <button
              type="submit"
              className="rounded-r-full bg-rabbit-red px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white hover:text-ink"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Shop links */}
        <div>
            <h3 className="font-display text-lg font-semibold text-white mb-4">Shop</h3>
            <ul className="space-y-2 text-white/60">
                <li>
                    <Link to="/" className="hover:text-white transition-colors">Men's Top Wear</Link>
                </li>
                <li>
                    <Link to="/" className="hover:text-white transition-colors">Women's Top Wear</Link>
                </li>
                <li>
                    <Link to="/" className="hover:text-white transition-colors">Men's Bottom Wear</Link>
                </li>
                <li>
                    <Link to="/" className="hover:text-white transition-colors">Women's Bottom Wear</Link>
                </li>
            </ul>
        </div>
        {/* Support links */}
        <div>
            <h3 className="font-display text-lg font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-white/60">
                <li>
                    <Link to="/" className="hover:text-white transition-colors">Contact Us</Link>
                </li>
                <li>
                    <Link to="/" className="hover:text-white transition-colors">About Us</Link>
                </li>
                <li>
                    <Link to="/" className="hover:text-white transition-colors">FAQs</Link>
                </li>
                <li>
                    <Link to="/" className="hover:text-white transition-colors">Features</Link>
                </li>
            </ul>
        </div>
        {/* Follow us section */}
        <div>
          <h3 className="font-display text-lg font-semibold text-white mb-4">Follow Us</h3>
          <div className="flex items-center space-x-4 mb-6">
            <a href="https://www.facebook.com" className="text-white/70 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
              <TbBrandMeta className="h-5 w-5"/>
            </a>
            <a href="https://www.instagram.com" className="text-white/70 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
              <IoLogoInstagram className="h-5 w-5"/>
            </a>
            <a href="https://www.x.com" className="text-white/70 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
              <RiTwitterXLine className="h-4 w-4"/>
            </a>
          </div>
          <p className="text-white/60">Call Us</p>
          <p>
            <FiPhoneCall className="inline-block mr-2"/>
            0123-456-789
          </p>
        </div>
      </div>
      {/* Footer bottom */}
      <div className="container mx-auto mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 px-4 pt-6 text-sm text-white/50 sm:flex-row lg:px-8">
        <p>&copy; {new Date().getFullYear()} KRAY. All rights reserved.</p>
        <p className="flex items-center gap-1.5">
          Handcrafted with
          <FaHeart className="h-3.5 w-3.5 text-rabbit-red" aria-hidden="true" />
          <span className="sr-only">love</span>
          by
          <span className="font-display text-base font-semibold text-white">Devanshu</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;