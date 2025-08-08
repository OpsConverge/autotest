import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard";
import TestResults from "./TestResults";
import BuildHistory from "./BuildHistory";
import Analytics from "./Analytics";
import AIAssistant from "./AIAssistant";
import Settings from "./Settings";
import Integrations from "./Integrations";
import Flakiness from "./Flakiness";
import TestScheduling from "./TestScheduling";
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
    TestScheduling: TestScheduling,
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

function TeamRedirect({ to }) {
    const teamId = localStorage.getItem('activeTeamId') || '1';
    return <Navigate to={`/teams/${teamId}/${to}`} replace />;
}

function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    const token = localStorage.getItem('token');
    
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
            
            {/* Landing page - show for unauthenticated users, redirect authenticated users */}
            <Route 
                path="/" 
                element={
                    token ? (
                        <RequireAuth>
                            <TeamRedirect to="dashboard" />
                        </RequireAuth>
                    ) : (
                        <LandingPage />
                    )
                } 
            />
            
            {/* Team-scoped routes */}
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
                                <Route path="testscheduling" element={<TestScheduling />} />
                            </Routes>
                        </Layout>
                    </RequireAuth>
                }
            />
            
            {/* Redirect root routes to team-scoped routes */}
            <Route
                path="/dashboard"
                element={
                    <RequireAuth>
                        <TeamRedirect to="dashboard" />
                    </RequireAuth>
                }
            />
            <Route
                path="/settings"
                element={
                    <RequireAuth>
                        <TeamRedirect to="settings" />
                    </RequireAuth>
                }
            />
            <Route
                path="/testresults"
                element={
                    <RequireAuth>
                        <TeamRedirect to="testresults" />
                    </RequireAuth>
                }
            />
            <Route
                path="/buildhistory"
                element={
                    <RequireAuth>
                        <TeamRedirect to="buildhistory" />
                    </RequireAuth>
                }
            />
            <Route
                path="/analytics"
                element={
                    <RequireAuth>
                        <TeamRedirect to="analytics" />
                    </RequireAuth>
                }
            />
            <Route
                path="/aiassistant"
                element={
                    <RequireAuth>
                        <TeamRedirect to="aiassistant" />
                    </RequireAuth>
                }
            />
            <Route
                path="/integrations"
                element={
                    <RequireAuth>
                        <TeamRedirect to="integrations" />
                    </RequireAuth>
                }
            />
            <Route
                path="/flakiness"
                element={
                    <RequireAuth>
                        <TeamRedirect to="flakiness" />
                    </RequireAuth>
                }
            />
            <Route
                path="/testscheduling"
                element={
                    <RequireAuth>
                        <TeamRedirect to="testscheduling" />
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