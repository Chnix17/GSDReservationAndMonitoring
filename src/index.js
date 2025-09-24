
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import RedirectHandler from "./utils/RedirectHandler";
import NotFound from "./utils/NotFound";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Check if we're at the root path, if so show redirect handler
// Otherwise, render the app with basename
const isRootPath = window.location.pathname === '/';
const isReservationPath = window.location.pathname.startsWith('/reservation');

root.render(
	<React.StrictMode>
		{isRootPath ? (
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<RedirectHandler />} />
				</Routes>
			</BrowserRouter>
		) : isReservationPath ? (
			<BrowserRouter basename="/reservation">
				<App />
			</BrowserRouter>
		) : (
			<BrowserRouter>
				<Routes>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</BrowserRouter>
		)}
	</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();