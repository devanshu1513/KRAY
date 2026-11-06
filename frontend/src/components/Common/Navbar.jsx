import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { HiOutlineUser, HiOutlineShoppingBag, HiBars3BottomRight } from "react-icons/hi2";
import SearchBar from './SearchBar';
import CartDrawer from '../Layout/CartDrawer';
import { IoMdClose } from 'react-icons/io';
import { useSelector } from 'react-redux';

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const {cart} = useSelector((state) => state.cart);
  const {user} = useSelector((state) => state.auth);

  const cartItemCount = cart?.products?.reduce((total, product) => total + product.quantity, 0) || 0;

  const toggleNavDrawer = () => {
      setNavDrawerOpen(!navDrawerOpen);
   }

  const toggleCartDrawer = () => {
      setDrawerOpen(!drawerOpen);
   }
    
  return (
    <>
      <nav className="container mx-auto flex items-center justify-between py-5 px-6">
        {/* Left - Logo */}
        <div>
          <Link to="/" className="font-display text-3xl font-extrabold tracking-tight">
            KRAY<span className="text-rabbit-red">.</span>
          </Link>
        </div>
        {/* Center - Navigation Links */}
        <div className="hidden md:flex space-x-8">
          <Link
            to="/collections/all?gender=Men"
            className="relative text-[15px] font-medium text-gray-600 transition-colors hover:text-ink after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-rabbit-red after:transition-transform hover:after:scale-x-100"
          >
            Men
          </Link>
          <Link
            to="/collections/all?gender=Women"
            className="relative text-[15px] font-medium text-gray-600 transition-colors hover:text-ink after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-rabbit-red after:transition-transform hover:after:scale-x-100"
          >
            Women
          </Link>
          <Link
            to="/collections/all?category=Top Wear"
            className="relative text-[15px] font-medium text-gray-600 transition-colors hover:text-ink after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-rabbit-red after:transition-transform hover:after:scale-x-100"
          >
            Top Wear
          </Link>
          <Link
            to="/collections/all?category=Bottom Wear"
            className="relative text-[15px] font-medium text-gray-600 transition-colors hover:text-ink after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-rabbit-red after:transition-transform hover:after:scale-x-100"
          >
            Bottom Wear
          </Link>
        </div>
        {/* Right - Search and User Icons */}
        <div className="flex items-center space-x-4">
          {user && user.role === "admin" && (
            <Link
              to="/admin"
              className="block rounded-full bg-ink px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-rabbit-red"
            >
              Admin
            </Link>
          )}
          <Link to="/profile" className="hover:text-black">
            <HiOutlineUser className="h-6 w-6 text-gray-700 transition-colors hover:text-rabbit-red" />
          </Link>
          <button
            onClick={toggleCartDrawer}
            className="relative hover:text-black"
          >
            <HiOutlineShoppingBag className="h-6 w-6 text-gray-700 transition-colors hover:text-rabbit-red" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-rabbit-red px-1 text-[11px] font-semibold text-white">
                {cartItemCount}
              </span>
            )}
          </button>
          {/* Search - new things to learn here */}
          <div className="overflow-hidden">
            <SearchBar />
          </div>
          <button onClick={toggleNavDrawer} className="md:hidden">
            <HiBars3BottomRight className="h-6 w-6 text-gray-700 transition-colors hover:text-rabbit-red" />
          </button>
        </div>
      </nav>
      <CartDrawer drawerOpen={drawerOpen} toggleCartDrawer={toggleCartDrawer} />

      {/* Mobile Navigation */}
      <div
        className={`fixed top-0 left-0 w-3/4 sm:w-1/2 md:w-1/2 h-full bg-white shadow-2xl transition-transform duration-300 z-50 ${
          navDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={toggleNavDrawer}>
            <IoMdClose className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <div className="p-4">
          <h2 className="font-display text-2xl font-bold mb-4">Menu</h2>
          <nav className="space-y-4">
            <Link
              to="/collections/all?gender=Men"
              onClick={toggleNavDrawer}
              className="block rounded-lg px-3 py-2 text-lg font-medium text-gray-700 transition-colors hover:bg-stone-100 hover:text-ink"
            >
              Men
            </Link>
            <Link
              to="/collections/all?gender=Women"
              onClick={toggleNavDrawer}
              className="block rounded-lg px-3 py-2 text-lg font-medium text-gray-700 transition-colors hover:bg-stone-100 hover:text-ink"
            >
              Women
            </Link>
            <Link
              to="/collections/all?category=Top Wear"
              onClick={toggleNavDrawer}
              className="block rounded-lg px-3 py-2 text-lg font-medium text-gray-700 transition-colors hover:bg-stone-100 hover:text-ink"
            >
              Top Wear
            </Link>
            <Link
              to="/collections/all?category=Bottom Wear"
              onClick={toggleNavDrawer}
              className="block rounded-lg px-3 py-2 text-lg font-medium text-gray-700 transition-colors hover:bg-stone-100 hover:text-ink"
            >
              Bottom Wear
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}

export default Navbar