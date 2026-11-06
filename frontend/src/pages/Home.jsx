import React from 'react'
import Hero from '../components/Layout/Hero'
import GenderCollectionSection from '../components/Products/GenderCollectionSection'
import NewArrivals from '../components/Products/NewArrivals'
import ProductDetails from '../components/Products/ProductDetails'
import ProductGrid from '../components/Products/ProductGrid'
import FeaturedCollection from '../components/Products/FeaturedCollection'
import FeaturesSection from '../components/Products/FeaturesSection'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProductsByFilters } from '../redux/slices/productsSlice'
import axios from 'axios'

const Home = () => {
    const dispatch = useDispatch();
    const { products, loading, error } = useSelector((state) => state.products);
    const [bestSellerProduct, setBestSellerProduct] = React.useState(null);
    const [bestSellerLoading, setBestSellerLoading] = React.useState(true);
    const [bestSellerError, setBestSellerError] = React.useState(false);

    React.useEffect(() => {
        // Fetch products for a specific collection
        dispatch(fetchProductsByFilters({
            gender: "Women",
            category: "Top Wear",
            limit: 8,
        }));
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
        <h2 className='font-display text-3xl md:text-4xl font-bold tracking-tight text-center mt-8 mb-6'>Best Seller</h2>
        {bestSellerProduct?._id ? (
          <ProductDetails productId={bestSellerProduct._id}/>
        ) : bestSellerLoading ? (
          <p className='text-center'>Loading best seller product...</p>
        ) : (
          <p role="status" className='py-8 text-center text-gray-600'>
            {bestSellerError ? "The best seller is temporarily unavailable." : "No best seller is available right now."}
          </p>
        )}

        <div className="container mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-center mb-10">Top Wears for Women</h2>
          <ProductGrid products={ products } loading={loading} error={error}/>
        </div>

        <FeaturedCollection />
        <FeaturesSection />
    </div>
  )
}

export default Home
