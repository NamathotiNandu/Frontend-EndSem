export default function useAuth() {
  const login = (token, user) => {
    try {
      if (token) localStorage.setItem('sgp_token', token);
      if (user) localStorage.setItem('sgp_user', JSON.stringify(user));
    } catch (e) {
      // ignore storage errors
      // (in strict environments this may throw)
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('sgp_token');
      localStorage.removeItem('sgp_user');
    } catch (e) {}
    // optional redirect to login
    if (typeof window !== 'undefined') window.location.href = '/login';
  };

  const getUser = () => {
    try {
      const raw = localStorage.getItem('sgp_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  return {
    login,
    logout,
    getUser,
    user: getUser()
  };
}
