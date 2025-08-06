import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard";
import TestResults from "./TestResults";
import BuildHistory from "./BuildHistory";
import Analytics from "./Analytics";
import AIAssistant from "./AIAssistant";
import Settings from "./Settings";
import Integrations from "./Integrations";
import Flakiness from "./Flakiness";
import Login from "./Login";
import Register from "./Register";
import LandingPage from "./landing";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    Dashboard: Dashboard,
    TestResults: TestResults,
    BuildHistory: BuildHistory,
    Analytics: Analytics,
    AIAssistant: AIAssistant,
    Settings: Settings,
    Integrations: Integrations,
    Flakiness: Flakiness,
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

function RequireAuth({ children }) {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/Login" replace />;
    }
    return children;
}

function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
            <Route
                path="/integrations"
                element={
                    <RequireAuth>
                        <Layout currentPageName="Integrations">
                            <Integrations />
                        </Layout>
                    </RequireAuth>
                }
            />
            <Route
                path="/flakiness"
                element={
                    <RequireAuth>
                        <Layout currentPageName="Flakiness">
                            <Flakiness />
                        </Layout>
                    </RequireAuth>
                }
            />
            <Route
                path="/teams/:teamId/*"
                element={
                    <RequireAuth>
                        <Layout currentPageName={currentPage}>
                            <Routes>
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="testresults" element={<TestResults />} />
                                <Route path="buildhistory" element={<BuildHistory />} />
                                <Route path="analytics" element={<Analytics />} />
                                <Route path="aiassistant" element={<AIAssistant />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="integrations" element={<Integrations />} />
                                <Route path="flakiness" element={<Flakiness />} />
                            </Routes>
                        </Layout>
                    </RequireAuth>
                }
            />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}