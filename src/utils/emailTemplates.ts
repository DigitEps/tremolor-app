export interface EmailTemplateData {
  userEmail: string;
  dominantVoice: string;
  progress: number;
  reportUrl?: string;
  userName?: string;
}

export class EmailTemplates {
  static getWelcomeTemplate(data: EmailTemplateData): { subject: string; html: string; text: string } {
    const subject = "El teu Mapa del Tremolor està llest! 🧭";
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mapa del Tremolor - Informe Professional</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .voice-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
        .voice-tu { background: #ffd700; color: #333; }
        .voice-ego { background: #38bdf8; color: white; }
        .voice-ombra { background: #a78bfa; color: white; }
        .highlight-box { background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .features { background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .features ul { margin: 0; padding-left: 20px; }
        .features li { margin: 8px 0; }
        .footer { background: #2d3748; color: white; padding: 30px; text-align: center; }
        .footer a { color: #90cdf4; text-decoration: none; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧭 Mapa del Tremolor</h1>
            <p>El teu informe professional està llest</p>
        </div>
        
        <div class="content">
            <h2>Hola${data.userName ? ` ${data.userName}` : ''}! 👋</h2>
            
            <p>Felicitats! Has completat l'anàlisi del Tremolor i el teu informe professional ja està disponible.</p>
            
            <div class="highlight-box">
                <h3>El teu perfil de veus internes:</h3>
                <p>Veu dominant: <span class="voice-badge voice-${data.dominantVoice.toLowerCase()}">${data.dominantVoice.toUpperCase()}</span></p>
                <p>Progrés completat: <strong>${data.progress}%</strong></p>
            </div>
            
            <div class="features">
                <h3>🎯 Què inclou el teu informe professional:</h3>
                <ul>
                    <li><strong>Anàlisi detallada</strong> de les teves tres veus internes (Tu/Ego/Ombra)</li>
                    <li><strong>Pla personalitzat</strong> de desenvolupament de 30 dies</li>
                    <li><strong>Scripts SOS</strong> per a situacions difícils</li>
                    <li><strong>Insights d'integració</strong> únics per al teu perfil</li>
                    <li><strong>Recomanacions específiques</strong> basades en les teves respostes</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="${data.reportUrl || '#'}" class="cta-button">
                    📄 Descarregar Informe Professional
                </a>
            </div>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">15-20</div>
                    <div class="stat-label">Pàgines</div>
                </div>
                <div class="stat">
                    <div class="stat-number">30</div>
                    <div class="stat-label">Dies de pla</div>
                </div>
                <div class="stat">
                    <div class="stat-number">97€</div>
                    <div class="stat-label">Valor</div>
                </div>
            </div>
            
            <p><strong>Consell:</strong> Dedica 10-15 minuts a llegir l'informe complet. Les insights més valuoses sovint estan en les seccions d'integració.</p>
            
            <p>Si tens qualsevol pregunta sobre el teu informe, respon aquest email i t'ajudarem.</p>
            
            <p>Bon viatge d'autoconeixement! 🌟</p>
        </div>
        
        <div class="footer">
            <p><strong>Tremolor App</strong> - Mapa del Tremolor Professional</p>
            <p>© 2024 Tremolor. Tots els drets reservats.</p>
            <p><a href="#">Política de privacitat</a> | <a href="#">Contacte</a></p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Hola${data.userName ? ` ${data.userName}` : ''}!

Felicitats! Has completat l'anàlisi del Tremolor i el teu informe professional ja està llest.

EL TEU PERFIL:
- Veu dominant: ${data.dominantVoice.toUpperCase()}
- Progrés completat: ${data.progress}%

QUÈ INCLOU EL TEU INFORME:
✓ Anàlisi detallada de les teves tres veus internes (Tu/Ego/Ombra)
✓ Pla personalitzat de desenvolupament de 30 dies
✓ Scripts SOS per a situacions difícils
✓ Insights d'integració únics per al teu perfil
✓ Recomanacions específiques basades en les teves respostes

Descarrega el teu informe aquí: ${data.reportUrl || 'Accedeix al teu compte'}

Consell: Dedica 10-15 minuts a llegir l'informe complet. Les insights més valuoses sovint estan en les seccions d'integració.

Si tens qualsevol pregunta, respon aquest email i t'ajudarem.

Bon viatge d'autoconeixement!

--
Tremolor App - Mapa del Tremolor Professional
© 2024 Tremolor. Tots els drets reservats.
`;

    return { subject, html, text };
  }

  static getFollowUpTemplate(data: EmailTemplateData, dayNumber: number): { subject: string; html: string; text: string } {
    const subjects = [
      "Dia 3: Com va la integració de les teves veus? 🌱",
      "Dia 7: Reflexions sobre el teu progrés 💭",
      "Dia 14: Aprofundint en el teu desenvolupament 🚀"
    ];
    
    const contents = [
      {
        title: "Primers passos en la integració",
        content: "Han passat 3 dies des que vas rebre el teu Mapa del Tremolor. Com va la implementació del pla de 30 dies?",
        tip: "Recorda: la clau està en la consistència, no en la perfecció. Fins i tot 5 minuts diaris de pràctica conscient poden generar canvis significatius."
      },
      {
        title: "Reflexió setmanal",
        content: "Ja fa una setmana que treballes amb el teu informe. És un bon moment per reflexionar sobre els patrons que has observat.",
        tip: "Pregunta't: Quina de les tres veus (Tu/Ego/Ombra) has notat més aquesta setmana? Què t'ha sorprès?"
      },
      {
        title: "Aprofundint el desenvolupament",
        content: "Dues setmanes de treball conscient amb les teves veus internes. És hora d'aprofundir en la integració.",
        tip: "Considera compartir les teves descobertes amb algú de confiança. L'expressió externa ajuda a consolidar la comprensió interna."
      }
    ];

    const index = Math.min(dayNumber === 3 ? 0 : dayNumber === 7 ? 1 : 2, contents.length - 1);
    const subject = subjects[index];
    const { title, content, tip } = contents[index];

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Tremolor</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px; }
        .tip-box { background: #e6fffa; border-left: 4px solid #38b2ac; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
        .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧭 ${title}</h1>
        </div>
        
        <div class="content">
            <p>Hola de nou!</p>
            
            <p>${content}</p>
            
            <div class="tip-box">
                <h3>💡 Consell del dia:</h3>
                <p>${tip}</p>
            </div>
            
            <p>Recorda que el teu informe professional sempre està disponible per consultar-lo quan necessitis orientació.</p>
            
            <div style="text-align: center;">
                <a href="${data.reportUrl || '#'}" class="cta-button">
                    Revisar el meu informe
                </a>
            </div>
            
            <p>Si vols compartir la teva experiència o tens preguntes, respon aquest email. M'encanta saber com evoluciona el vostre viatge!</p>
            
            <p>Segueix endavant! 🌟</p>
        </div>
        
        <div class="footer">
            <p>Tremolor App - Acompanyant el teu creixement personal</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
${title}

Hola de nou!

${content}

CONSELL DEL DIA:
${tip}

Recorda que el teu informe professional sempre està disponible per consultar-lo quan necessitis orientació.

Revisar el meu informe: ${data.reportUrl || 'Accedeix al teu compte'}

Si vols compartir la teva experiència o tens preguntes, respon aquest email. M'encanta saber com evoluciona el vostre viatge!

Segueix endavant! 🌟

--
Tremolor App - Acompanyant el teu creixement personal
`;

    return { subject, html, text };
  }
}