import React, { useEffect } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatINR, getEffectivePrice } from '../../utils/price';

const NewArrivals = () => {
    const scrollRef = React.useRef(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [startX, setStartX] = React.useState(0);
    const [scrollLeft, setScrollLeft] = React.useState(false);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(true);
    const [newArrivals, setNewArrivals] = React.useState([]);
    const [loadError, setLoadError] = React.useState(false);

    useEffect(() => {
        const fetchNewArrivals = async () => {
            try {
                const apiUrl = import.meta.env.VITE_BACKEND_URL;
                if (!apiUrl) throw new Error('VITE_BACKEND_URL is not configured.');

                const response = await axios.get(
                    `${apiUrl}/products/new-arrivals`
                );
                if (!Array.isArray(response.data)) {
                    throw new Error('The new arrivals endpoint returned an invalid response.');
                }
                setNewArrivals(response.data);
            } catch (error) {
                console.error('Error fetching new arrivals:', error);
                setLoadError(true);
            }
        };

        fetchNewArrivals();
    }, []);
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    }

    const handleMouseMove = (e) => {
        if(!isDragging) return;
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = x - startX;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    }

    const handleMouseUpOrLeave = () => {
        setIsDragging(false);
    }

    const scroll = (direction) => {
        const scrollAmount = direction === 'left' ? -300 : 300;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    // Update scroll buttons
    const updateScrollButtons = () => {
        const container = scrollRef.current;

        if(container) {
            const leftScroll = container.scrollLeft;
            const rightScrollable = container.scrollWidth > leftScroll + container.clientWidth;
            setCanScrollLeft(leftScroll > 0);
            setCanScrollRight(rightScrollable);
        }
    };

    useEffect(() => {
            const container = scrollRef.current;
            if(container) {
                container.addEventListener("scroll", updateScrollButtons);
                updateScrollButtons();
                return () => container.removeEventListener("scroll", updateScrollButtons);
            };
        }, [newArrivals]);

  return (
    <section className='py-12 md:py-16'>
        <div className="container mx-auto mb-7 flex items-end justify-between gap-4 px-4 md:mb-9">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-rabbit-red">Fresh picks for everyone</p>
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-4xl">New to KRAY</h2>
              <p className="mt-2 max-w-xl text-sm text-gray-600 md:text-base">A considered mix of shirts, tops, and everyday bottoms for him and her.</p>
            </div>
            <div className='flex shrink-0 gap-2'>
                <button aria-label="Scroll new arrivals left" onClick={() => scroll("left")} disabled={!canScrollLeft} className={`rounded-full border border-black/10 p-2.5 transition ${canScrollLeft ? "bg-white text-ink hover:bg-stone-100" : "bg-stone-100 text-gray-300 cursor-not-allowed"}`}>
                    <FiChevronLeft className="text-2xl" />
                </button>
                <button aria-label="Scroll new arrivals right" onClick={() => scroll("right")} disabled={!canScrollRight} className={`rounded-full border border-black/10 p-2.5 transition ${canScrollRight ? "bg-white text-ink hover:bg-stone-100" : "bg-stone-100 text-gray-300 cursor-not-allowed"}`}>
                    <FiChevronRight className="text-2xl" />
                </button>
            </div>
        </div>

        <div ref={scrollRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUpOrLeave} onMouseLeave={handleMouseUpOrLeave} className={`container mx-auto flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:gap-6 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
            {loadError ? (
                <p role="status" className="w-full py-8 text-center text-gray-600">New arrivals are temporarily unavailable.</p>
            ) : newArrivals.map((product) => (
                <article key={product._id} className='w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[30%] xl:w-[24%]'>
                    <Link to={`/product/${product._id}`} className="block overflow-hidden rounded-2xl bg-[#f6f5f2] ring-1 ring-black/5">
                      <div className="aspect-[4/5]">
                        <img src={product.images?.[0]?.url}
                          alt={product.images?.[0]?.altText || product.name}
                          className='h-full w-full object-contain p-5 transition-transform duration-500 hover:scale-[1.04] md:p-7'
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                    </Link>
                    <div className="pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">{product.gender} · {product.category}</p>
                        <Link to={`/product/${product._id}`} className="mt-1 block font-medium text-ink hover:text-rabbit-red">
                            <h3 className='line-clamp-1 text-sm md:text-base'>{product.name}</h3>
                            <p className='mt-1.5 text-sm font-semibold'>{formatINR(getEffectivePrice(product))}</p>
                        </Link>
                    </div>
                </article>
            ))}
        </div>
    </section>
  )
}

export default NewArrivals
