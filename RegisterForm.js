import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as registerApi } from '../src/config/api/authApi';
import useAuth from '../hooks/useAuth';

const RegisterForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    group: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await registerApi(form);
      login(res.data.token, res.data.user);
      // apply a background after successful registration/login
      try {
        const user = res.data.user || {};
        if (user.role === 'admin') {
          document.body.style.backgroundImage = "url('/images/admin-bg.jpg')";
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundRepeat = 'no-repeat';
          document.body.style.backgroundPosition = 'center';
        } else {
          document.body.style.backgroundImage = "url('/images/student-bg.jpg')";
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundRepeat = 'no-repeat';
          document.body.style.backgroundPosition = 'center';
        }
      } catch (bgErr) {
        document.body.style.backgroundColor = '#f7fafc';
      }
      if (res.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold">Register</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm mb-1">Name</label>
        <input
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Password</label>
        <input
          name="password"
          type="password"
          required
          value={form.password}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Role</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="student">Student</option>
          <option value="admin">Admin (Teacher)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Group</label>
        <input
          name="group"
          value={form.group}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Optional group name"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-medium"
      >
        Register
      </button>
    </form>
  );
};

export default RegisterForm;
