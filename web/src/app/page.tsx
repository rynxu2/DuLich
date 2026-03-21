'use client';

export default function HomePage() {
  if (typeof window !== 'undefined') {
    window.location.href = '/admin';
  }
  return null;
}
