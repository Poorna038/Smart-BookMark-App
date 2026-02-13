'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [bookmarks, setBookmarks] = useState<any[]>([])

  // Check session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/')
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    checkSession()
  }, [router])

  // Fetch bookmarks
  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setBookmarks(data)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBookmarks()
    }
  }, [user])

  // Realtime
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('realtime-bookmarks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBookmarks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const addBookmark = async (e: any) => {
    e.preventDefault()
    if (!title || !url) return

    await supabase.from('bookmarks').insert([
      {
        title,
        url,
        user_id: user.id,
      },
    ])

    setTitle('')
    setUrl('')
  }

  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen p-10 bg-linear-to-br from-gray-100 to-gray-200">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-200">

        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          My Bookmarks 🔖
        </h1>

        <p className="mb-6 text-sm text-gray-600">
          Logged in as: <strong>{user?.email}</strong>
        </p>

        <form onSubmit={addBookmark} className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Title"
            className="w-full p-3 border border-gray-300 rounded-md 
                       text-black placeholder-gray-400 bg-white 
                       focus:outline-none focus:ring-2 focus:ring-black"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="text"
            placeholder="URL"
            className="w-full p-3 border border-gray-300 rounded-md 
                       text-black placeholder-gray-400 bg-white 
                       focus:outline-none focus:ring-2 focus:ring-black"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Add Bookmark
          </button>
        </form>

        <div className="space-y-3">
          {bookmarks.length === 0 && (
            <p className="text-gray-500">No bookmarks yet.</p>
          )}

          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:underline"
              >
                {bookmark.title}
              </a>

              <button
                onClick={() => deleteBookmark(bookmark.id)}
                className="text-red-500 text-sm hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 text-sm text-red-600 hover:text-red-800"
        >
          Logout
        </button>

      </div>
    </div>
  )
}
