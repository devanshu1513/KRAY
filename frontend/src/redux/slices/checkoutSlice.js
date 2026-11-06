import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { logout } from "./authSlice";

// Async thunk to create a checkout session
export const createCheckout = createAsyncThunk("checkout/createCheckout", async (checkoutdata, { rejectWithValue, dispatch }) => {
    try {
        const token = localStorage.getItem("userToken");
        if (!token) {
            dispatch(logout());
            return rejectWithValue({
                message: "Your sign-in has expired. Please sign in again to continue checkout.",
                requiresLogin: true,
            });
        }

        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/checkout`, checkoutdata, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            dispatch(logout());
            return rejectWithValue({
                message: "Your sign-in has expired. Please sign in again to continue checkout.",
                requiresLogin: true,
            });
        }
        return rejectWithValue(error.response?.data || { message: error.message || "Could not start checkout. Please try again." });
    }
});

const checkoutSlice = createSlice({
    name: "checkout",
    initialState: {
        checkout: false,
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(createCheckout.pending, (state) => {
            state.loading = true;
            state.error = null;
        }).addCase(createCheckout.fulfilled, (state, action) => {
            state.loading = false;
            state.checkout = action.payload;
        }).addCase(createCheckout.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload?.message || "Could not start checkout. Please try again.";
        })
    }
});

export default checkoutSlice.reducer;
