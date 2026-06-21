import { Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { RouteTransitionMarker, ScrollToTop, ToastHost } from "./components/AppRouteEffects.jsx";
import FloatingChatWidget from "./components/FloatingChatWidget.jsx";
import Home from "./pages/Home.jsx";
import SelfDrivePage from "./pages/SelfDrive.jsx";
import SelfDriveDetailPage from "./pages/SelfDriveDetail.jsx";
import ChauffeurDrivePage from "./pages/ChauffeurDrive.jsx";
import ProfilePage from "./pages/Profile.jsx";
import MyRentalsPage from "./pages/MyRentals.jsx";
import NewsPage from "./pages/NewsPage.jsx";
import NewsDetailPage from "./pages/NewsDetailPage.jsx";
import TermsPolicyPage from "./pages/TermsPolicyPage.jsx";

function App() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <RouteTransitionMarker locationKey={location.pathname} />
      <div className="page-route-shell" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Home adminMode />} />
          <Route path="/thue-xe-tu-lai" element={<SelfDrivePage />} />
          <Route path="/thue-xe-tu-lai/:carSlug" element={<SelfDriveDetailPage />} />
          <Route path="/thue-xe-co-lai" element={<ChauffeurDrivePage />} />
          <Route path="/gioi-thieu" element={<Home initialAbout />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-rentals" element={<MyRentalsPage />} />
          <Route path="/tin-tuc" element={<NewsPage />} />
          <Route path="/tin-tuc/:slug" element={<NewsDetailPage />} />
          <Route path="/dieu-khoan-su-dung" element={<TermsPolicyPage />} />
        </Routes>
      </div>
      <FloatingChatWidget />
      <ToastHost />
    </>
  );
}

export default App;