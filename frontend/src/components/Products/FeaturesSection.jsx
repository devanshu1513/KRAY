import React from 'react'
import { HiOutlineCreditCard, HiShoppingBag } from 'react-icons/hi'
import { HiArrowPathRoundedSquare } from 'react-icons/hi2'

const FeaturesSection = () => {
  return (
    <section className='py-16 px-4 bg-white'>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Feature 1 */}
            <div className="flex flex-col items-center">
                <div className="mb-4 rounded-full bg-stone-100 p-4 text-rabbit-red">
                    <HiShoppingBag className="text-2xl" />
                </div>
                <h4 className="font-display text-lg font-semibold mb-1">Free International Shipping</h4>
                <p className='text-gray-600 text-sm'>
                    On all orders over $100
                </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center">
                <div className="mb-4 rounded-full bg-stone-100 p-4 text-rabbit-red">
                    <HiArrowPathRoundedSquare className="text-2xl" />
                </div>
                <h4 className="font-display text-lg font-semibold mb-1">45 Days Return</h4>
                <p className='text-gray-600 text-sm'>
                    Money-back guaranteed
                </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center">
                <div className="mb-4 rounded-full bg-stone-100 p-4 text-rabbit-red">
                    <HiOutlineCreditCard className="text-2xl" />
                </div>
                <h4 className="font-display text-lg font-semibold mb-1">Secure Checkout</h4>
                <p className='text-gray-600 text-sm'>
                    100% secured checkout process
                </p>
            </div>
        </div>
    </section>
  )
}

export default FeaturesSection