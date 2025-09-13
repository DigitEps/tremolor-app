import jsPDF from 'jspdf';

export interface Answer {
  partKey: string;
  question: string;
  response: string;
  dominant: string;
  createdAt: string;
}

export interface VoiceStats {
  progress: number;
  completed: number;
  dominantVoice: string;
  counts: Record<string, number>;
  percent: (voice: string) => number;
}

export interface ReportData {
  answers: Answer[];
  stats: VoiceStats;
  userEmail?: string;
  generatedAt: string;
}

export class ProfessionalPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  private addNewPageIfNeeded(requiredSpace: number = 20): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addTitle(text: string, fontSize: number = 20): void {
    this.addNewPageIfNeeded(15);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(44, 62, 80);
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += fontSize * 0.6;
  }

  private addSubtitle(text: string, fontSize: number = 14): void {
    this.addNewPageIfNeeded(10);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(52, 73, 94);
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += fontSize * 0.6;
  }

  private addParagraph(text: string, fontSize: number = 11): void {
    this.addNewPageIfNeeded(15);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(44, 62, 80);
    
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin);
    lines.forEach((line: string) => {
      this.addNewPageIfNeeded(5);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += fontSize * 0.5;
    });
    this.currentY += 5;
  }

  private addVoiceSection(voiceName: string, percentage: number, color: string, description: string, insights: string[]): void {
    this.addNewPageIfNeeded(40);
    
    // Voice header with colored bar
    this.doc.setFillColor(...this.hexToRgb(color));
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 8, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(`${voiceName} - ${percentage}%`, this.margin + 5, this.currentY);
    this.currentY += 15;

    // Description
    this.doc.setTextColor(44, 62, 80);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'italic');
    this.addParagraph(description, 12);

    // Insights
    insights.forEach((insight, index) => {
      this.addNewPageIfNeeded(8);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`• ${insight}`, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
    
    this.currentY += 10;
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  private addCoverPage(data: ReportData): void {
    // Background gradient effect (simulated with rectangles)
    this.doc.setFillColor(26, 32, 44);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Title
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('MAPA DEL TREMOLOR', this.pageWidth / 2, 60, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(203, 213, 224);
    this.doc.text('Anàlisi Professional de les Teves Veus Internes', this.pageWidth / 2, 75, { align: 'center' });
    
    // User info
    if (data.userEmail) {
      this.doc.setFontSize(12);
      this.doc.text(`Generat per: ${data.userEmail}`, this.pageWidth / 2, 90, { align: 'center' });
    }
    
    // Stats box
    const boxY = 110;
    this.doc.setFillColor(45, 55, 72);
    this.doc.roundedRect(this.margin, boxY, this.pageWidth - 2 * this.margin, 40, 5, 5, 'F');
    
    this.doc.setFontSize(14);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(`Progrés: ${data.stats.progress}%`, this.pageWidth / 2, boxY + 15, { align: 'center' });
    this.doc.text(`Veu Dominant: ${data.stats.dominantVoice.toUpperCase()}`, this.pageWidth / 2, boxY + 25, { align: 'center' });
    this.doc.text(`Respostes Analitzades: ${data.stats.completed}/15`, this.pageWidth / 2, boxY + 35, { align: 'center' });
    
    // Date
    this.doc.setFontSize(10);
    this.doc.setTextColor(160, 174, 192);
    this.doc.text(`Generat el ${new Date(data.generatedAt).toLocaleDateString('ca-ES')}`, this.pageWidth / 2, this.pageHeight - 20, { align: 'center' });
    
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private getVoiceInsights(voiceName: string, answers: Answer[]): string[] {
    const voiceAnswers = answers.filter(a => a.dominant?.toLowerCase() === voiceName.toLowerCase());
    const insights: string[] = [];
    
    switch (voiceName.toLowerCase()) {
      case 'tu':
        insights.push('Busques integració i coherència en la teva vida');
        insights.push('Valores l\'autenticitat per sobre de l\'aprovació externa');
        insights.push('Tens capacitat per veure més enllà de les aparences');
        if (voiceAnswers.length > 0) {
          insights.push(`Reflexió clau: "${voiceAnswers[0].response.slice(0, 100)}..."`);
        }
        break;
      case 'ego':
        insights.push('Prioritzes el control i la seguretat en les teves decisions');
        insights.push('Tens una forta necessitat d\'ordre i estructura');
        insights.push('Protegeixes la teva imatge i reputació');
        if (voiceAnswers.length > 0) {
          insights.push(`Patró identificat: "${voiceAnswers[0].response.slice(0, 100)}..."`);
        }
        break;
      case 'ombra':
        insights.push('Hi ha aspectes de tu mateix que prefereixes no veure');
        insights.push('Pots tenir pors o traumes no resolts');
        insights.push('La teva ombra conté tant perills com potencials ocults');
        if (voiceAnswers.length > 0) {
          insights.push(`Aspecte ocult: "${voiceAnswers[0].response.slice(0, 100)}..."`);
        }
        break;
    }
    
    return insights;
  }

  public generateReport(data: ReportData): Uint8Array {
    // Cover page
    this.addCoverPage(data);
    
    // Introduction
    this.addTitle('Introducció al Teu Mapa del Tremolor');
    this.addParagraph('Aquest informe analitza les tres veus internes que guien les teves decisions i reaccions: Tu (la veu de la integració), Ego (la veu del control) i Ombra (la veu dels aspectes ocults).');
    this.addParagraph('Cada veu té el seu propòsit i saviesa. L\'objectiu no és eliminar cap d\'elles, sinó comprendre com interactuen i aprendre a integrar-les de manera equilibrada.');
    
    // Voice analysis sections
    const voices = [
      { name: 'Tu', color: '#FFD700', description: 'La veu de la integració i la saviesa interior' },
      { name: 'Ego', color: '#38bdf8', description: 'La veu del control i la protecció' },
      { name: 'Ombra', color: '#a78bfa', description: 'La veu dels aspectes ocults i reprimits' }
    ];
    
    voices.forEach(voice => {
      this.addTitle(`Anàlisi de la Veu ${voice.name}`);
      const percentage = data.stats.percent(voice.name.toLowerCase());
      const insights = this.getVoiceInsights(voice.name, data.answers);
      this.addVoiceSection(voice.name, percentage, voice.color, voice.description, insights);
    });
    
    // Integration insights
    this.addTitle('Insights d\'Integració');
    this.addParagraph('La clau del creixement personal està en la integració equilibrada de les tres veus. Aquí tens les teves recomanacions personalitzades:');
    
    // Personalized recommendations based on dominant voice
    const dominantVoice = data.stats.dominantVoice;
    let recommendations: string[] = [];
    
    switch (dominantVoice.toLowerCase()) {
      case 'tu':
        recommendations = [
          'Continua cultivant la teva capacitat d\'integració',
          'Practica l\'acceptació dels aspectes menys agradables de tu mateix',
          'Busca l\'equilibri entre l\'autenticitat i les necessitats pràctiques'
        ];
        break;
      case 'ego':
        recommendations = [
          'Practica deixar anar el control en situacions menors',
          'Explora què hi ha darrere de la necessitat de protecció',
          'Desenvolupa la confiança en la teva capacitat d\'adaptació'
        ];
        break;
      case 'ombra':
        recommendations = [
          'Dedica temps a explorar els teus aspectes ocults amb compassió',
          'Busca suport professional si detectes patrons destructius',
          'Practica la integració gradual dels aspectes reprimits'
        ];
        break;
    }
    
    recommendations.forEach(rec => {
      this.addParagraph(`• ${rec}`);
    });
    
    // 30-day plan
    this.addTitle('Pla de Desenvolupament de 30 Dies');
    this.addSubtitle('Setmana 1: Consciència');
    this.addParagraph('• Observa quina veu domina en diferents situacions del dia');
    this.addParagraph('• Porta un diari de les teves reaccions automàtiques');
    this.addParagraph('• Practica 5 minuts de meditació diària');
    
    this.addSubtitle('Setmana 2: Acceptació');
    this.addParagraph('• Accepta les tres veus sense jutjar-les');
    this.addParagraph('• Identifica els triggers que activen cada veu');
    this.addParagraph('• Practica la compassió cap a tu mateix');
    
    this.addSubtitle('Setmana 3: Integració');
    this.addParagraph('• Experimenta amb respostes diferents a situacions habituals');
    this.addParagraph('• Busca l\'equilibri entre les tres veus en decisions importants');
    this.addParagraph('• Comparteix les teves descobertes amb algú de confiança');
    
    this.addSubtitle('Setmana 4: Consolidació');
    this.addParagraph('• Revisa el teu progrés i celebra els avenços');
    this.addParagraph('• Identifica els patrons que vols mantenir');
    this.addParagraph('• Planifica el teu desenvolupament continu');
    
    // Footer
    this.addNewPageIfNeeded(30);
    this.currentY = this.pageHeight - 30;
    this.doc.setFontSize(10);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text('© Tremolor App - Mapa del Tremolor Professional', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    return this.doc.output('arraybuffer') as Uint8Array;
  }
}