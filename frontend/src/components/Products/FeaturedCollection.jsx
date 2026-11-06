import React from 'react'
import { Link } from 'react-router-dom'
import featured from "../../assets/featured.webp"

const FeaturedCollection = () => {
  return (
    <section className='py-16 px-4 lg:px-0'>
        <div className="container mx-auto flex flex-col-reverse lg:flex-row items-center bg-stone-100 rounded-3xl overflow-hidden">
            {/* Left content */}
            <div className="lg:w-1/2 p-8 text-center lg:text-left">
                <h2 className='text-sm font-semibold text-rabbit-red mb-3'>Comfort and Style</h2>
                <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-6">Apparel made for your everyday life</h2>
                <p className="text-lg text-gray-600 mb-8">Discover high-quality, comfortable clothing that effortlessly blends fashion and function. Designed to make you look and feel great every day.</p>
                <Link to="/collections/all" className="inline-flex rounded-full bg-ink px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-rabbit-red">Shop Now</Link>
            </div>

            {/* Right content */}
            <div className="lg:w-1/2">
                <img src={featured} alt="Featured Collection" className='w-full h-full object-cover'/>
            </div>
        </div>
    </section>
  )
}

export default FeaturedCollection