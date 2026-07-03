import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/context/AuthContext';
import { Shell } from '@/components/Shell';
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute';

import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Upload from '@/pages/Upload';
import Results from '@/pages/Results';
import Profile from '@/pages/Profile';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/">
          <Home />
        </Route>
        
        <Route path="/login">
          <PublicRoute><Login /></PublicRoute>
        </Route>
        
        <Route path="/register">
          <PublicRoute><Register /></PublicRoute>
        </Route>
        
        <Route path="/dashboard">
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        </Route>
        
        <Route path="/upload">
          <ProtectedRoute><Upload /></ProtectedRoute>
        </Route>
        
        <Route path="/results/:id">
          {(params) => <ProtectedRoute><Results id={params.id} /></ProtectedRoute>}
        </Route>
        
        <Route path="/profile">
          <ProtectedRoute><Profile /></ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
