import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalysisButton } from "@/components/ui/AnalysisButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, BrainIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Ainalyzer</h1>
              <Badge variant="secondary">v1.0.0</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Connexion</Button>
              </Link>
              <Link href="/register">
                <Button>Inscription</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Plateforme d'Analyse d'Images
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Analysez vos images avec l'intelligence artificielle pour améliorer l'accessibilité 
            et extraire des informations précieuses.
          </p>
          <div className="flex justify-center space-x-4">
            <AnalysisButton size="lg" className="px-8">
              Commencer l'analyse
            </AnalysisButton>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BrainIcon className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Analyse IA Avancée</CardTitle>
              <CardDescription>
                Utilisez OpenAI et Anthropic pour des analyses d'images précises et détaillées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Description automatique</li>
                <li>• Détection d'objets</li>
                <li>• Analyse d'accessibilité</li>
                <li>• Extraction de texte</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <ShieldCheckIcon className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Sécurité & Confidentialité</CardTitle>
              <CardDescription>
                Vos données et clés API sont chiffrées et sécurisées avec Supabase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Chiffrement des clés API</li>
                <li>• Authentification sécurisée</li>
                <li>• Sessions gérées</li>
                <li>• Isolation des données</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <UsersIcon className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Gestion Multi-utilisateurs</CardTitle>
              <CardDescription>
                Interface d'administration complète avec gestion des rôles et permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Dashboard utilisateur</li>
                <li>• Interface admin</li>
                <li>• Statistiques d'usage</li>
                <li>• Historique des analyses</li>
              </ul>
            </CardContent>
          </Card>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>© 2024 Ainalyzer - Plateforme d'analyse d'images avec IA</p>
            <p className="text-sm mt-2">
              Développé avec Next.js 14, TypeScript, TailwindCSS et Shadcn/UI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
