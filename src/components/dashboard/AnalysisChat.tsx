'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  SendIcon, 
  BotIcon, 
  UserIcon, 
  Loader2Icon,
  SettingsIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from 'lucide-react'
import { useApiKeys } from '@/hooks/useApiKeys'

// Types pour le parser d'analyse
interface AnalysisItem {
  type: 'item'
  label: string
  content: string
}

interface AnalysisCode {
  type: 'code'
  content: string
}

interface AnalysisText {
  type: 'text'
  content: string
}

interface AnalysisSection {
  type: 'section'
  title: string
  items: (AnalysisItem | AnalysisCode | AnalysisText)[]
}

interface AnalysisTitle {
  type: 'main-title'
  content: string
}

type ParsedContent = (AnalysisTitle | AnalysisSection)[]

// Composant pour formater les messages spéciaux (accueil, upload, analyse terminée)
function FormattedSpecialContent({ content }: { content: string }) {
  // Détecter le type de message spécial
  if (content.includes('🖼️ **Image uploadée avec succès !**')) {
    const lines = content.split('\n')
    const titleLine = lines[0] // "🖼️ **Image uploadée avec succès !**"
    const restContent = lines.slice(1).join('\n')
    
    // Extraire le nom de l'image du contenu
    const imageNameMatch = restContent.match(/votre image "([^"]+)"/)
    const imageName = imageNameMatch ? imageNameMatch[1] : ''
    
    return (
      <div className="space-y-2">
        <h3 className="text-base font-bold text-gray-900 flex items-center">
          <span className="mr-2">🖼️</span>
          <span>Image uploadée avec succès !</span>
        </h3>
        <div className="text-sm text-gray-700">
          <p>Parfait ! J'ai bien reçu votre image <strong>"{imageName}"</strong>.</p>
          <p className="mt-2">Maintenant, quel type d'analyse souhaitez-vous que je réalise ? Vous pouvez sélectionner plusieurs types d'analyses :</p>
        </div>
      </div>
    )
  }
  
  if (content.includes('✨ **Analyse terminée !**')) {
    const lines = content.split('\n')
    const titleLine = lines[0] // "✨ **Analyse terminée !**"
    const restContent = lines.slice(2).join('\n') // Skip empty line
    
    return (
      <div className="space-y-2">
        <h3 className="text-base font-bold text-gray-900 flex items-center">
          <span className="mr-2">✨</span>
          <span>Analyse terminée !</span>
        </h3>
        <div className="text-sm text-gray-700">
          <p>{restContent}</p>
        </div>
      </div>
    )
  }
  
  if (content.includes('🚀 **Analyse lancée !**')) {
    const lines = content.split('\n')
    const titleLine = lines[0] // "🚀 **Analyse lancée !**"
    const restContent = lines.slice(2).join('\n') // Skip empty line
    
    return (
      <div className="space-y-2">
        <h3 className="text-base font-bold text-gray-900 flex items-center">
          <span className="mr-2">🚀</span>
          <span>Analyse lancée !</span>
        </h3>
        <div className="text-sm text-gray-700">
          <p>{restContent}</p>
        </div>
      </div>
    )
  }
  
  // Message d'accueil
  if (content.includes('Bonjour ! Je suis Ainalyzer AI')) {
    return (
      <div className="space-y-2">
        <h3 className="text-base font-bold text-gray-900">
          Bonjour ! Je suis Ainalyzer AI
        </h3>
        <div className="text-sm text-gray-700">
          <p>Votre assistant spécialisé en accessibilité web.</p>
          <p className="mt-2">Je peux vous aider à comprendre les principes d'accessibilité, analyser vos interfaces et proposer des améliorations.</p>
          <p className="mt-2"><strong>Comment puis-je vous aider aujourd'hui ?</strong></p>
        </div>
      </div>
    )
  }
  
  // Fallback pour autres contenus
  return <div className="text-sm whitespace-pre-wrap">{content}</div>
}

// Composant pour formater le contenu des analyses
function FormattedAnalysisContent({ content }: { content: string }) {
  // Parser le contenu de l'analyse
  const parseAnalysisContent = (text: string): ParsedContent => {
    const lines = text.split('\n')
    const result: ParsedContent = []
    let currentSection: AnalysisSection | null = null
    let codeBlock = ''
    let inCodeBlock = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Détecter le titre principal (ex: "📊 **Analyse Région (Claude 3.5 Sonnet) terminée**")
      if (line.includes('**Analyse') && line.includes('terminée**')) {
        const title = line.replace(/📊\s*\*\*/, '').replace(/\*\*/, '')
        result.push({ type: 'main-title', content: title })
        continue
      }
      
      // Détecter les sections numérotées (ex: "1. Navigation Latérale (Sidebar)")
      if (/^\d+\.\s/.test(line)) {
        if (currentSection) {
          result.push(currentSection)
        }
        currentSection = {
          type: 'section',
          title: line.replace(/^\d+\.\s/, ''),
          items: []
        }
        continue
      }
      
      // Détecter les blocs de code
      if (line.includes('```')) {
        if (inCodeBlock) {
          // Fin du bloc de code
          if (currentSection) {
            currentSection.items.push({ type: 'code', content: codeBlock.trim() })
          }
          codeBlock = ''
          inCodeBlock = false
        } else {
          // Début du bloc de code
          inCodeBlock = true
          codeBlock = ''
        }
        continue
      }
      
      if (inCodeBlock) {
        codeBlock += line + '\n'
        continue
      }
      
      // Détecter les éléments avec tirets (ex: "- Rôle et fonction : ...")
      if (line.startsWith('- ') && currentSection) {
        const [label, ...contentParts] = line.substring(2).split(' : ')
        currentSection.items.push({
          type: 'item',
          label: label.trim(),
          content: contentParts.join(' : ').trim()
        })
        continue
      }
      
      // Ligne vide ou autre contenu
      if (line.trim() && currentSection && !line.startsWith('- ')) {
        // Ajouter comme contenu général de la section
        if (currentSection.items.length === 0 || currentSection.items[currentSection.items.length - 1].type !== 'text') {
          currentSection.items.push({ type: 'text', content: line.trim() })
        } else {
          currentSection.items[currentSection.items.length - 1].content += ' ' + line.trim()
        }
      }
    }
    
    // Ajouter la dernière section
    if (currentSection) {
      result.push(currentSection)
    }
    
    return result
  }

  const parsedContent = parseAnalysisContent(content)

  return (
    <div className="space-y-3 max-w-full">
      {parsedContent.map((item, index) => {
        if (item.type === 'main-title') {
          return (
            <div key={index} className="mb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center break-words">
                <span className="mr-2 flex-shrink-0">📊</span>
                <span className="break-words">{item.content}</span>
              </h3>
            </div>
          )
        }
        
        if (item.type === 'section') {
          return (
            <div key={index} className="border-l-3 border-blue-500 pl-3 mb-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2 break-words">
                {item.title}
              </h4>
              <div className="space-y-2">
                {item.items.map((subItem, subIndex) => {
                  if (subItem.type === 'item') {
                    return (
                      <div key={subIndex} className="flex items-start space-x-2">
                        <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-700 text-xs break-words">{subItem.label}</span>
                          {subItem.content && (
                            <span className="text-gray-600 ml-1 text-xs break-words">: {subItem.content}</span>
                          )}
                        </div>
                      </div>
                    )
                  }
                  
                  if (subItem.type === 'code') {
                    return (
                      <div key={subIndex} className="mt-2">
                        <div className="bg-gray-900 rounded p-2 overflow-x-auto max-w-full">
                          <pre className="text-xs text-gray-200 whitespace-pre-wrap break-words">
                            <code>{subItem.content}</code>
                          </pre>
                        </div>
                      </div>
                    )
                  }
                  
                  if (subItem.type === 'text') {
                    return (
                      <div key={subIndex} className="text-xs text-gray-600 break-words">
                        {subItem.content}
                      </div>
                    )
                  }
                  
                  return null
                })}
              </div>
            </div>
          )
        }
        
        return null
      })}
    </div>
  )
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  provider?: string
  model?: string
  usage?: any
  showAnalysisSelector?: boolean
  selectorDisabled?: boolean // Nouveau flag pour désactiver le sélecteur
}

interface AnalysisChatProps {
  isAnalyzing?: boolean
  uploadedImage?: File | null
  selectedTypes?: string[]
  analysisMessages?: Message[]
  currentStep?: 'upload' | 'configure' | 'analyze' | 'results'
  analysisTypes?: any[]
  onAnalysisTypesChange?: (types: string[]) => void
  onStartAnalysis?: () => void
  hasApiKeys?: boolean
  selectedProvider?: 'openai' | 'anthropic'
  onProviderChange?: (provider: 'openai' | 'anthropic') => void
}

export function AnalysisChat({ 
  isAnalyzing = false, 
  uploadedImage = null, 
  selectedTypes = [],
  analysisMessages = [],
  currentStep = 'upload',
  analysisTypes = [],
  onAnalysisTypesChange,
  onStartAnalysis,
  hasApiKeys = false,
  selectedProvider: propSelectedProvider = 'openai',
  onProviderChange
}: AnalysisChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour ! Je suis Ainalyzer AI, votre assistant spécialisé en accessibilité web. Je peux vous aider à comprendre les principes d\'accessibilité, analyser vos interfaces et proposer des améliorations. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { apiKeys } = useApiKeys()

  // Utiliser le provider passé en props ou fallback sur le state local
  const selectedProvider = propSelectedProvider

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Désactiver les sélecteurs quand une analyse commence
  useEffect(() => {
    if (isAnalyzing) {
      setMessages(prev => prev.map(msg => 
        msg.showAnalysisSelector && !msg.selectorDisabled 
          ? { ...msg, selectorDisabled: true }
          : msg
      ))
    } else {
      // Quand l'analyse se termine, masquer complètement les anciens sélecteurs
      setMessages(prev => prev.map(msg => 
        msg.selectorDisabled 
          ? { ...msg, showAnalysisSelector: false, selectorDisabled: false }
          : msg
      ))
    }
  }, [isAnalyzing])

  // Intégrer les messages d'analyse dans la conversation
  useEffect(() => {
    if (analysisMessages.length > 0) {
      // Ajouter les nouveaux messages d'analyse
      const newMessages = analysisMessages.filter(
        analysisMsg => !messages.some(msg => msg.id === analysisMsg.id)
      )
      
      if (newMessages.length > 0) {
        setMessages(prev => [...prev, ...newMessages])
        
        // Ajouter une nouvelle bulle de sélection après chaque analyse terminée
        const lastAnalysisMessage = newMessages[newMessages.length - 1]
        if (lastAnalysisMessage && lastAnalysisMessage.content.includes('terminée')) {
          // Attendre 2 secondes pour que l'analyse soit bien affichée
          setTimeout(() => {
            // Créer un seul message avec le texte d'invitation et les chips
            const newSelectionMessage = {
              id: `reselect-${Date.now()}`,
              role: 'assistant' as const,
              content: `✨ **Analyse terminée !**\n\nSouhaitez-vous effectuer une autre analyse sur cette même image ? Sélectionnez le ou les types d'analyses :`,
              timestamp: new Date(),
              showAnalysisSelector: true,
              selectorDisabled: false
            }
            
            setMessages(prev => [...prev, newSelectionMessage])
          }, 2000) // Délai de 2 secondes comme demandé
        }
      }
    }
  }, [analysisMessages, messages])

  // Réagir quand une image est uploadée
  useEffect(() => {
    if (uploadedImage && currentStep === 'configure') {
      // Créer un ID unique basé sur le nom et la taille du fichier pour éviter les doublons
      const imageId = `${uploadedImage.name}-${uploadedImage.size}-${uploadedImage.lastModified}`
      const configMessageId = `config-${imageId}-${Date.now()}`
      
      // Ajouter un message de l'IA demandant le type d'analyse
      const configMessage = {
        id: configMessageId,
        role: 'assistant' as const,
        content: `🖼️ **Image uploadée avec succès !**\n\nParfait ! J'ai bien reçu votre image "${uploadedImage.name}". \n\nMaintenant, quel type d'analyse souhaitez-vous que je réalise ? Vous pouvez sélectionner plusieurs types d'analyses :`,
        timestamp: new Date(),
        showAnalysisSelector: true // Flag pour afficher le sélecteur
      }
      
      // Toujours ajouter un nouveau message (pas de vérification d'existence)
      // Cela permet d'avoir une nouvelle bulle à chaque upload d'image
      setMessages(prev => [...prev, configMessage])
    }
  }, [uploadedImage, currentStep, analysisTypes])

  // Vérifier les clés API disponibles
  const availableProviders = apiKeys
    .filter(key => key.active)
    .map(key => key.provider as 'openai' | 'anthropic')

  const hasApiKeysLocal = availableProviders.length > 0

  // S'assurer que le provider sélectionné est disponible
  useEffect(() => {
    if (hasApiKeysLocal && !availableProviders.includes(selectedProvider) && onProviderChange) {
      onProviderChange(availableProviders[0])
    }
  }, [availableProviders, selectedProvider, hasApiKeysLocal, onProviderChange])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !hasApiKeysLocal) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      // Préparer l'historique de conversation pour l'API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          provider: selectedProvider,
          conversationHistory
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du message')
      }

      if (!data.success) {
        throw new Error(data.error || 'Réponse invalide')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data.message,
        timestamp: new Date(),
        provider: data.data.provider,
        model: data.data.model,
        usage: data.data.usage
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      
      // Ajouter un message d'erreur dans le chat
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Désolé, une erreur s'est produite : ${errorMessage}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'openai':
        return { name: 'GPT-4', color: 'bg-green-100 text-green-800', icon: '🤖' }
      case 'anthropic':
        return { name: 'Claude', color: 'bg-purple-100 text-purple-800', icon: '🧠' }
      default:
        return { name: provider, color: 'bg-gray-100 text-gray-800', icon: '🔍' }
    }
  }

  if (!hasApiKeys) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <Alert>
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Aucune clé API configurée. 
              <br />
              <a href="/api-keys" className="text-blue-600 hover:underline">
                Configurez vos clés API
              </a> pour utiliser le chat IA.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header avec sélection du provider */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BotIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Ainalyzer AI</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {availableProviders.length > 1 && (
              <select
                value={selectedProvider}
                onChange={(e) => onProviderChange && onProviderChange(e.target.value as 'openai' | 'anthropic')}
                className="text-xs border rounded px-2 py-1"
                disabled={isLoading}
              >
                {availableProviders.map(provider => {
                  const info = getProviderInfo(provider)
                  return (
                    <option key={provider} value={provider}>
                      {info.name}
                    </option>
                  )
                })}
              </select>
            )}
            
            <Badge className={getProviderInfo(selectedProvider).color}>
              {getProviderInfo(selectedProvider).icon} {getProviderInfo(selectedProvider).name}
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[70vh] overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          // Déterminer si ce message a quelque chose à afficher
          const hasNormalContent = message.content.trim() && !message.showAnalysisSelector
          const hasInvitationBubble = message.showAnalysisSelector && message.content.trim() && !message.selectorDisabled
          const hasSelector = message.showAnalysisSelector
          
          // Ne pas afficher le conteneur si le message n'a rien à montrer
          if (!hasNormalContent && !hasInvitationBubble && !hasSelector) {
            return null
          }
          
          return (
            <div key={message.id} className="space-y-3">
              {/* N'afficher la bulle que si le message a du contenu ET n'est pas un sélecteur */}
              {hasNormalContent && (
                <div
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <BotIcon className="h-4 w-4 mt-0.5 text-blue-600" />
                      )}
                      {message.role === 'user' && (
                        <UserIcon className="h-4 w-4 mt-0.5 text-white" />
                      )}
                    <div className="flex-1">
                    {/* Contenu formaté selon le type de message */}
                    {message.role === 'assistant' && message.content.includes('**Analyse') && message.content.includes('terminée') ? (
                      <FormattedAnalysisContent content={message.content} />
                    ) : message.role === 'assistant' && (
                      message.content.includes('🖼️ **Image uploadée avec succès !**') ||
                      message.content.includes('✨ **Analyse terminée !**') ||
                      message.content.includes('🚀 **Analyse lancée !**') ||
                      message.content.includes('Bonjour ! Je suis Ainalyzer AI')
                    ) ? (
                      <FormattedSpecialContent content={message.content} />
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    )}
                      
                      {/* Métadonnées pour les réponses IA */}
                      {message.role === 'assistant' && message.provider && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                          <div className="flex items-center justify-between">
                            <span>{getProviderInfo(message.provider).name}</span>
                            {message.usage && (
                              <span>{message.usage.total_tokens} tokens</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulle de texte d'invitation pour les sélecteurs */}
              {hasInvitationBubble && (
                <div className="flex justify-start mb-3">
                  <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-900">
                    <div className="flex items-start space-x-2">
                      <BotIcon className="h-4 w-4 mt-0.5 text-blue-600" />
                      <div className="flex-1">
                        <FormattedSpecialContent content={message.content} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sélecteur d'analyses avec chips - en dehors de la bulle */}
              {hasSelector && (
                <div className="flex justify-start">
                  <div className={`max-w-[80%] space-y-3 ${message.selectorDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Chips de sélection */}
                    <div className="flex flex-wrap gap-2">
                      {analysisTypes.map((type) => {
                        const isSelected = selectedTypes.includes(type.id)
                        return (
                          <button
                            key={type.id}
                            onClick={() => {
                              if (onAnalysisTypesChange && !message.selectorDisabled) {
                                if (isSelected) {
                                  onAnalysisTypesChange(selectedTypes.filter(id => id !== type.id))
                                } else {
                                  onAnalysisTypesChange([...selectedTypes, type.id])
                                }
                              }
                            }}
                            disabled={message.selectorDisabled}
                            className={`
                              inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2
                              ${message.selectorDisabled 
                                ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
                                : isSelected 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                              }
                            `}
                          >
                            <span className="mr-2">{type.name}</span>
                            {isSelected && !message.selectorDisabled && (
                              <CheckCircleIcon className="h-4 w-4" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Bouton d'analyse */}
                    {selectedTypes.length > 0 && !message.selectorDisabled && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          {selectedTypes.length} analyse{selectedTypes.length > 1 ? 's' : ''} sélectionnée{selectedTypes.length > 1 ? 's' : ''}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (onStartAnalysis) {
                              onStartAnalysis()
                            }
                          }}
                          disabled={isAnalyzing}
                          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
                              Analyse en cours...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Lancer l'analyse
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Message d'analyse en cours avec animation */}
                    {message.selectorDisabled && (
                      <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="font-medium">Analyse en cours...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <BotIcon className="h-4 w-4 text-blue-600" />
                <Loader2Icon className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">
                  {getProviderInfo(selectedProvider).name} réfléchit...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-3 border-t">
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez une question sur l'accessibilité..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
          >
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Utilise {getProviderInfo(selectedProvider).name} • Consomme vos tokens API
        </div>
      </div>
    </div>
  )
}
