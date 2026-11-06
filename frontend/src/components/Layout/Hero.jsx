import React from 'react'
import heroImg from '../../assets/kray-hero.jpg'
import { Link } from 'react-router'

const Hero = () => {
  return (
    <section className='relative'>
      <img
        src={heroImg}
        alt="KRAY fashion collection"
        className='w-full h-[460px] md:h-[640px] lg:h-[760px] object-cover'
      />

      <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/70 via-black/25 to-transparent">
        <div className="container mx-auto px-6 pb-12 md:pb-20 text-white">
          <h1 className='font-display text-5xl md:text-8xl lg:text-9xl font-extrabold leading-[0.9] tracking-tight mb-5'>
            Style<br />Redefined
          </h1>

          <p className="max-w-md text-base md:text-lg text-white/90 mb-8">
            Discover your style with KRAY. Find the perfect look for every occasion.
          </p>

          <Link
            to="/collections/all"
            className="inline-flex items-center rounded-full bg-rabbit-red px-8 py-3 text-base font-semibold text-white shadow-lg transition-colors hover:bg-white hover:text-ink"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
