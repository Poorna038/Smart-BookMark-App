'use client'

import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/dashboard')
      }
    }

    checkSession()
  }, [router])

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center w-96 border border-gray-200">

        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Smart Bookmark 🔖
        </h1>

        <button
          onClick={loginWithGoogle}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Sign in with Google
        </button>

      </div>
    </div>
  )
}
