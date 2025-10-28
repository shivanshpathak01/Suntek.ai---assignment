'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Signup failed');
      }
      localStorage.setItem('token', json.data.token);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen  flex items-center justify-center bg-zinc-50 p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-black">Create account</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="space-y-1">
          <label className="text-sm text-black">Name</label>
          <input className="w-full border text-black border-zinc-300 rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-black">Email</label>
          <input type="email" className="w-full border text-black border-zinc-300 rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-black">Password</label>
          <input type="password" className="w-full text-black border border-zinc-300 rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <button disabled={loading} className="w-full bg-black text-white rounded py-2 disabled:opacity-60">{loading ? 'Creating...' : 'Sign up'}</button>
        <p className="text-sm text-zinc-600">Already have an account? <a className="underline" href="/login">Log in</a></p>
      </form>
    </div>
  );
}


