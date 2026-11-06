import React from 'react'
import Header from '../Common/Header'
import Footer from '../Common/Footer'
import { Outlet } from 'react-router-dom'
import ShoppingAssistant from '../Common/ShoppingAssistant'

const UserLayout = () => {
  return (
    <>
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
    <ShoppingAssistant />
    </>
  )
}

export default UserLayout
