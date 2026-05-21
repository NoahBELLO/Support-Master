'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (token === null || (user !== null && user.role !== 'admin')) {
      router.replace('/')
    }
  }, [token, user, router])

  if (!user || user.role !== 'admin') return null

  return <>{children}</>
}
