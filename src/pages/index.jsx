import Layout from "./Layout.jsx";

import Home from "./Home";

import Novel from "./Novel";

import Reader from "./Reader";

import Library from "./Library";

import Browse from "./Browse";

import Profile from "./Profile";

import Debug from "./Debug";

import CreatorDashboard from "./CreatorDashboard";

import DataCleanup from "./DataCleanup";

import SchemaUpdate from "./SchemaUpdate";

import Administrator from "./Administrator";

import AuthorPage from "./AuthorPage";

import ServerDiagnostic from "./ServerDiagnostic";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Novel: Novel,
    
    Reader: Reader,
    
    Library: Library,
    
    Browse: Browse,
    
    Profile: Profile,
    
    Debug: Debug,
    
    CreatorDashboard: CreatorDashboard,
    
    DataCleanup: DataCleanup,
    
    SchemaUpdate: SchemaUpdate,
    
    Administrator: Administrator,
    
    AuthorPage: AuthorPage,
    
    ServerDiagnostic: ServerDiagnostic,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Novel" element={<Novel />} />
                
                <Route path="/Reader" element={<Reader />} />
                
                <Route path="/Library" element={<Library />} />
                
                <Route path="/Browse" element={<Browse />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Debug" element={<Debug />} />
                
                <Route path="/CreatorDashboard" element={<CreatorDashboard />} />
                
                <Route path="/DataCleanup" element={<DataCleanup />} />
                
                <Route path="/SchemaUpdate" element={<SchemaUpdate />} />
                
                <Route path="/Administrator" element={<Administrator />} />
                
                <Route path="/AuthorPage" element={<AuthorPage />} />
                
                <Route path="/ServerDiagnostic" element={<ServerDiagnostic />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}