'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'

interface BackButtonProps {
  href: string
  label?: string
}

export function BackButton({ href, label = "Retour" }: BackButtonProps) {
  return (
    <div className="border-b bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-2">
        <Link href={href}>
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        </Link>
      </div>
    </div>
  )
}
