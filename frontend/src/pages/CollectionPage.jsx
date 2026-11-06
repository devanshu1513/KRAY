import React, { useEffect, useRef } from "react";
import { FaFilter } from "react-icons/fa";
import FilterSidebar from "../components/Products/FilterSidebar";
import SortOptions from "../components/Products/SortOptions";
import ProductGrid from "../components/Products/ProductGrid";
import { useParams, useSearchParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productsSlice";

const PAGE_SIZE = 12;

const CollectionPage = () => {
  const {collection} = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const {products, loading, loadingMore, error, page, pages, total} = useSelector((state) => state.products);
  const queryParams = Object.fromEntries([...searchParams]);
  const sidebarRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    dispatch(fetchProductsByFilters({ collection, ...queryParams, page: 1, limit: PAGE_SIZE }))
  }, [dispatch, collection, searchParams]);

  const handleLoadMore = () => {
    dispatch(fetchProductsByFilters({ collection, ...queryParams, page: page + 1, limit: PAGE_SIZE }));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleClickOutside = (e) => {
    // Close sidebar if clicked outside and don't close when clicking inside the sidebar
    if(sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsSidebarOpen(false);
    }
  }

  useEffect(() => {
    // Add event listener to close sidebar when clicking outside by listening to document clicks
    document.addEventListener("mousedown", handleClickOutside);
    // Cleanup the event listener on component unmount
    return() => {
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row">
        {/* Mobile filter button */}
        <button onClick={toggleSidebar} className="lg:hidden flex items-center justify-center border-y border-neel/15 bg-chandan py-3 font-medium text-neel">
            <FaFilter className="mr-2"/> Filters
        </button>

        {/* Filter sidebar */}
        <div ref={sidebarRef} className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 z-50 left-0 w-72 shrink-0 bg-chandan shadow-xl overflow-y-auto transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none lg:border-r lg:border-neel/10`}>
            <FilterSidebar />
        </div>
        <div className="grow min-w-0 p-4 lg:p-8">
            <h2 className="font-display text-3xl font-bold tracking-tight text-neel mb-4">All Collection</h2>

            {/* Sort option */}
            <SortOptions />

            {/* Product grid */}
            <ProductGrid products={products} loading={loading} error={error}/>

            {/* Load more */}
            {!loading && !error && products.length > 0 && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <p className="text-sm text-gray-600">Showing {products.length} of {total}</p>
                {page < pages && (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="rounded-full border-2 border-neel px-8 py-2.5 font-medium text-neel transition-colors hover:bg-neel hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                )}
              </div>
            )}
        </div>
    </div>
    )
};

export default CollectionPage;