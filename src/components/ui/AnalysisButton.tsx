'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface AnalysisButtonProps {
  size?: 'default' | 'sm' | 'lg'
  className?: string
  children: React.ReactNode
}

export function AnalysisButton({ size = 'default', className = '', children }: AnalysisButtonProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [supabase.auth])

  const handleClick = () => {
    if (user) {
      router.push('/analyse')
    } else {
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <Button size={size} className={className} disabled>
        {children}
      </Button>
    )
  }

  return (
    <Button size={size} className={className} onClick={handleClick}>
      {children}
    </Button>
  )
}
