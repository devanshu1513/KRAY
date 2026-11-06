import React from 'react'
import Hero from '../components/Layout/Hero'
import GenderCollectionSection from '../components/Products/GenderCollectionSection'
import NewArrivals from '../components/Products/NewArrivals'
import ProductGrid from '../components/Products/ProductGrid'
import FeaturedCollection from '../components/Products/FeaturedCollection'
import FeaturesSection from '../components/Products/FeaturesSection'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProductsByFilters } from '../redux/slices/productsSlice'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { formatINR, getEffectivePrice, hasDiscount } from '../utils/price'

const Home = () => {
    const dispatch = useDispatch();
    const { products, loading, error } = useSelector((state) => state.products);
    const [menProducts, setMenProducts] = React.useState([]);
    const [menLoading, setMenLoading] = React.useState(true);
    const [menError, setMenError] = React.useState(false);
    const [bestSellerProduct, setBestSellerProduct] = React.useState(null);
    const [bestSellerLoading, setBestSellerLoading] = React.useState(true);
    const [bestSellerError, setBestSellerError] = React.useState(false);

    React.useEffect(() => {
        // Fetch products for a specific collection
        dispatch(fetchProductsByFilters({
            gender: "Women",
            category: "Top Wear",
            limit: 4,
        }));
        const fetchMenProducts = async () => {
            try {
                const apiUrl = import.meta.env.VITE_BACKEND_URL;
                const response = await axios.get(`${apiUrl}/products`, { params: { gender: "Men", category: "Top Wear", limit: 4 } });
                setMenProducts(Array.isArray(response.data) ? response.data : []);
            } catch (requestError) {
                console.error('Error fetching men’s top wear:', requestError);
                setMenError(true);
            } finally {
                setMenLoading(false);
            }
        };
        fetchMenProducts();
        // Fetch best seller product
        const fetchBestSeller = async () => {
            try {
                const apiUrl = import.meta.env.VITE_BACKEND_URL;
                if (!apiUrl) throw new Error('VITE_BACKEND_URL is not configured.');

                const response = await axios.get(`${apiUrl}/products/best-seller`);
                if (!response.data || typeof response.data !== 'object' || Array.isArray(response.data) || !response.data._id) {
                    throw new Error('The best seller endpoint returned an invalid response.');
                }
                setBestSellerProduct(response.data);
            } catch (error) {
                console.error('Error fetching best seller product:', error);
                setBestSellerError(true);
            } finally {
                setBestSellerLoading(false);
            }
        };
        fetchBestSeller();
    }, [dispatch]);

  return (
    <div>
        <Hero />
        <GenderCollectionSection />
        <NewArrivals />
        {/* Best seller */}
        <section className="mx-auto my-10 max-w-7xl px-4 md:my-16">
          <h2 className='mb-6 text-center font-display text-3xl font-bold tracking-tight md:mb-8 md:text-4xl'>The KRAY Pick</h2>
        {bestSellerProduct?._id ? (
          <div className="grid overflow-hidden rounded-3xl bg-[#f5f4f1] md:grid-cols-2">
            <Link to={`/product/${bestSellerProduct._id}`} className="flex aspect-[4/3] items-center justify-center bg-[#efeeeb] p-6 md:aspect-auto md:min-h-[420px] md:p-12">
              <img src={bestSellerProduct.images?.[0]?.url} alt={bestSellerProduct.images?.[0]?.altText || bestSellerProduct.name} className="h-full max-h-[420px] w-full object-contain transition-transform duration-500 hover:scale-[1.03]" />
            </Link>
            <div className="flex flex-col justify-center p-6 md:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rabbit-red">Best seller · {bestSellerProduct.brand}</p>
              <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">{bestSellerProduct.name}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600 md:text-base">{bestSellerProduct.description}</p>
              <p className="mt-5 flex items-baseline gap-3">
                <span className="text-xl font-semibold text-ink">{formatINR(getEffectivePrice(bestSellerProduct))}</span>
                {hasDiscount(bestSellerProduct) && <span className="text-sm text-gray-400 line-through">{formatINR(bestSellerProduct.price)}</span>}
              </p>
              <Link to={`/product/${bestSellerProduct._id}`} className="mt-6 inline-flex w-fit rounded-full bg-ink px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-rabbit-red">Shop this style</Link>
            </div>
          </div>
        ) : bestSellerLoading ? (
          <p className='text-center'>Loading best seller product...</p>
        ) : (
          <p role="status" className='py-8 text-center text-gray-600'>
            {bestSellerError ? "The best seller is temporarily unavailable." : "No best seller is available right now."}
          </p>
        )}
        </section>

        <div className="container mx-auto px-4 py-6 md:py-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-rabbit-red">For him</p><h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Men’s shirts & tees</h2></div>
            <Link to="/collections/all?gender=Men&category=Top%20Wear" className="shrink-0 text-sm font-semibold text-ink underline underline-offset-4">Shop men</Link>
          </div>
          <ProductGrid products={menProducts} loading={menLoading} error={menError ? "Men’s top wear is temporarily unavailable." : ""}/>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-rabbit-red">For her</p><h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Women’s tops</h2></div>
            <Link to="/collections/all?gender=Women&category=Top%20Wear" className="shrink-0 text-sm font-semibold text-ink underline underline-offset-4">Shop women</Link>
          </div>
          <ProductGrid products={ products } loading={loading} error={error}/>
        </div>

        <FeaturedCollection />
        <FeaturesSection />
    </div>
  )
}

export default Home
