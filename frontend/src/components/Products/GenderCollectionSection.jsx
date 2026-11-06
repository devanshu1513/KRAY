import React from 'react'
import mensCollectionImage from '../../assets/mens-collection.webp'
import womensCollectionImage from '../../assets/womens-collection.webp'
import { Link } from 'react-router-dom'

const collections = [
  { title: "Women's Collection", alt: "Women's collection image", img: womensCollectionImage, to: '/collections/all?gender=Women' },
  { title: "Men's Collection", alt: "Men's collection image", img: mensCollectionImage, to: '/collections/all?gender=Men' },
]

const GenderCollectionSection = () => {
  return (
    <section className='py-16 px-4 lg:px-0'>
        <div className='container mx-auto grid gap-6 md:grid-cols-2'>
            {collections.map(({ title, alt, img, to }) => (
                <Link key={to} to={to} className="group relative block overflow-hidden rounded-2xl">
                    <img src={img} alt={alt} className='h-[460px] w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-[640px]'/>
                    <div className='absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent'></div>
                    <div className='absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 text-white'>
                        <h2 className='font-display text-3xl font-bold tracking-tight'>{title}</h2>
                        <span className='shrink-0 rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink transition-colors group-hover:bg-rabbit-red group-hover:text-white'>Shop Now</span>
                    </div>
                </Link>
            ))}
        </div>
    </section>
  )
}

export default GenderCollectionSection