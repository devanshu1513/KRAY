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
    <section className='py-16 px-4 lg:px-0'>
        <div className="container mx-auto text-center mb-10 relative">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">Explore New Arrivals</h2>
            <p className="text-lg text-gray-600 mb-8">Discover the latest styles straight off the runway, freshly added to keep your wardrobe on the cutting edge of fashion!</p>
            {/* Scroll buttons */}
            <div className='absolute right-0 bottom-[-30px] flex space-x-2'>
                <button onClick={() => scroll("left")} disabled={!canScrollLeft} className={`p-2 rounded-lg border border-gray-300 ${canScrollLeft ? "bg-white text-black" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                    <FiChevronLeft className="text-2xl" />
                </button>
                <button  onClick={() => scroll("right")} className={`p-2 rounded-lg border border-gray-300 ${canScrollRight ? "bg-white text-black" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                    <FiChevronRight className="text-2xl" />
                </button>
            </div>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUpOrLeave} onMouseLeave={handleMouseUpOrLeave} className={`container mx-auto overflow-x-scroll flex space-x-6 relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} `}>
            {loadError ? (
                <p role="status" className="w-full py-8 text-center text-gray-600">New arrivals are temporarily unavailable.</p>
            ) : newArrivals.map((product) => (
                <div key={product._id} className='min-w-full sm:min-w-[50%] lg:min-w-[30%] relative'>
                    <img src={product.images?.[0]?.url}
                    alt={product.images?.[0]?.altText || product.name}
                    className='w-full h-[500px] object-cover rounded-lg'
                    draggable={false}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-opacity-50 backdrop-blur-md text-white p-4 rounded-b-lg">
                        <Link to={`/product/${product._id}`} className="block">
                            <h4 className='font-medium'>{product.name}</h4>
                            <p className='mt-1'>{formatINR(getEffectivePrice(product))}</p>
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    </section>
  )
}

export default NewArrivals
