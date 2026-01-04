import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Workshops from './pages/Workshops';
import Products from './pages/Products';
import ShopTransactions from './pages/ShopTransactions';
import TowingTransactions from './pages/TowingTransactions';
import QuotationTransactions from './pages/QuotationTransactions';
import Vehicles from './pages/Vehicles';
import Banners from './pages/Banners';

function App() {
  return (
    <AuthProvider>
      <Router basename="/admin">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workshops"
            element={
              <ProtectedRoute>
                <Layout>
                  <Workshops />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Layout>
                  <Products />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/shop"
            element={
              <ProtectedRoute>
                <Layout>
                  <ShopTransactions />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/towing"
            element={
              <ProtectedRoute>
                <Layout>
                  <TowingTransactions />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/quotation"
            element={
              <ProtectedRoute>
                <Layout>
                  <QuotationTransactions />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute>
                <Layout>
                  <Vehicles />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/banners"
            element={
              <ProtectedRoute>
                <Layout>
                  <Banners />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

