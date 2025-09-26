import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { AnalysisHistoryItem } from '@/types'

export interface PdfGenerationOptions {
  analysis: AnalysisHistoryItem
  includeAnnotations?: boolean
  includeOriginalImage?: boolean
  customTitle?: string
  customDescription?: string
}

export class PdfGenerator {
  private pdf: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.pdf.internal.pageSize.getWidth()
    this.pageHeight = this.pdf.internal.pageSize.getHeight()
    this.margin = 20
    this.currentY = this.margin
  }

  async generateAnalysisPdf(options: PdfGenerationOptions): Promise<Blob> {
    const { analysis, customTitle, customDescription } = options

    // Réinitialiser la position
    this.currentY = this.margin

    // En-tête du document
    this.addHeader()
    
    // Titre de l'analyse
    this.addTitle(customTitle || analysis.title)
    
    // Informations générales
    this.addAnalysisInfo(analysis)
    
    // Description personnalisée si fournie
    if (customDescription) {
      this.addSection('Description', customDescription)
    }
    
    // Image originale
    if (options.includeOriginalImage && analysis.original_image_url) {
      await this.addImage(analysis.original_image_url, 'Image originale')
    }
    
    // Image avec annotations
    if (options.includeAnnotations && analysis.annotated_image_url) {
      await this.addImage(analysis.annotated_image_url, 'Image avec annotations')
    }
    
    // Résultats de l'analyse
    this.addAnalysisResults(analysis)
    
    // Métadonnées techniques
    this.addTechnicalMetadata(analysis)
    
    // Pied de page
    this.addFooter()

    return this.pdf.output('blob')
  }

  private addHeader() {
    // Logo/Titre de l'application
    this.pdf.setFontSize(20)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Ainalyzer - Rapport d\'analyse', this.margin, this.currentY)
    
    // Ligne de séparation
    this.currentY += 10
    this.pdf.setLineWidth(0.5)
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 15
  }

  private addTitle(title: string) {
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    
    // Gérer les titres longs avec retour à la ligne
    const lines = this.pdf.splitTextToSize(title, this.pageWidth - 2 * this.margin)
    this.pdf.text(lines, this.margin, this.currentY)
    this.currentY += lines.length * 7 + 10
  }

  private addAnalysisInfo(analysis: AnalysisHistoryItem) {
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'normal')
    
    const info = [
      `Date d'analyse: ${new Date(analysis.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`,
      `Type d'analyse: ${analysis.analysis_type}`,
      `Catégorie: ${analysis.analysis_category}`,
      `Fournisseur IA: ${analysis.provider}`,
      `Image analysée: ${analysis.image_name}`,
      `Taille de l'image: ${this.formatFileSize(analysis.image_size_bytes)}`,
      `Durée de traitement: ${this.formatDuration(analysis.duration_ms)}`,
      `Tokens utilisés: ${analysis.tokens_used || 'N/A'}`
    ]

    info.forEach(line => {
      this.pdf.text(line, this.margin, this.currentY)
      this.currentY += 6
    })
    
    this.currentY += 10
  }

  private addSection(title: string, content: string) {
    // Vérifier si on a besoin d'une nouvelle page
    if (this.currentY > this.pageHeight - 50) {
      this.pdf.addPage()
      this.currentY = this.margin
    }

    // Titre de section
    this.pdf.setFontSize(14)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(title, this.margin, this.currentY)
    this.currentY += 10

    // Contenu
    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'normal')
    
    const lines = this.pdf.splitTextToSize(content, this.pageWidth - 2 * this.margin)
    this.pdf.text(lines, this.margin, this.currentY)
    this.currentY += lines.length * 5 + 15
  }

  private async addImage(imageUrl: string, caption: string) {
    try {
      // Vérifier si on a besoin d'une nouvelle page
      if (this.currentY > this.pageHeight - 100) {
        this.pdf.addPage()
        this.currentY = this.margin
      }

      // Titre de l'image
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(caption, this.margin, this.currentY)
      this.currentY += 10

      // Charger l'image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })

      // Calculer les dimensions pour s'adapter à la page
      const maxWidth = this.pageWidth - 2 * this.margin
      const maxHeight = 120 // Hauteur maximale en mm
      
      const { width, height } = this.calculateImageDimensions(
        img.width, 
        img.height, 
        maxWidth, 
        maxHeight
      )

      // Ajouter l'image au PDF
      this.pdf.addImage(img, 'JPEG', this.margin, this.currentY, width, height)
      this.currentY += height + 15

    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'image:', error)
      // Ajouter un message d'erreur à la place
      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'italic')
      this.pdf.text('Image non disponible', this.margin, this.currentY)
      this.currentY += 15
    }
  }

  private addAnalysisResults(analysis: AnalysisHistoryItem) {
    this.addSection('Résultats de l\'analyse', analysis.preview_text)
    
    if (analysis.summary && analysis.summary !== analysis.preview_text) {
      this.addSection('Résumé', analysis.summary)
    }

    // Annotations
    if (analysis.annotations_count > 0) {
      this.addSection('Annotations', `${analysis.annotations_count} annotations ont été identifiées sur cette image.`)
    }
  }

  private addTechnicalMetadata(analysis: AnalysisHistoryItem) {
    // Vérifier si on a besoin d'une nouvelle page
    if (this.currentY > this.pageHeight - 60) {
      this.pdf.addPage()
      this.currentY = this.margin
    }

    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Métadonnées techniques', this.margin, this.currentY)
    this.currentY += 10

    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    
    const metadata = [
      `ID de l'analyse: ${analysis.id}`,
      `Format d'image: ${analysis.image_format}`,
      `Statut: ${analysis.status}`,
      `Favori: ${analysis.is_favorite ? 'Oui' : 'Non'}`,
      `Tags: ${analysis.tags.length > 0 ? analysis.tags.join(', ') : 'Aucun'}`
    ]

    metadata.forEach(line => {
      this.pdf.text(line, this.margin, this.currentY)
      this.currentY += 5
    })
  }

  private addFooter() {
    const pageCount = (this.pdf as any).getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i)
      
      // Ligne de séparation
      this.pdf.setLineWidth(0.3)
      this.pdf.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15)
      
      // Texte du pied de page
      this.pdf.setFontSize(8)
      this.pdf.setFont('helvetica', 'normal')
      
      const footerText = `Généré par Ainalyzer le ${new Date().toLocaleDateString('fr-FR')}`
      this.pdf.text(footerText, this.margin, this.pageHeight - 8)
      
      const pageText = `Page ${i} sur ${pageCount}`
      const pageTextWidth = this.pdf.getTextWidth(pageText)
      this.pdf.text(pageText, this.pageWidth - this.margin - pageTextWidth, this.pageHeight - 8)
    }
  }

  private calculateImageDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth: number, 
    maxHeight: number
  ) {
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight)
    return {
      width: originalWidth * ratio,
      height: originalHeight * ratio
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }
}

// Fonction utilitaire pour générer un PDF
export async function generateAnalysisPdf(
  analysis: AnalysisHistoryItem,
  options: Partial<PdfGenerationOptions> = {}
): Promise<Blob> {
  const generator = new PdfGenerator()
  return generator.generateAnalysisPdf({
    analysis,
    includeAnnotations: true,
    includeOriginalImage: true,
    ...options
  })
}

// Fonction pour télécharger le PDF
export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
