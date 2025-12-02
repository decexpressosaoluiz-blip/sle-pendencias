import { GoogleGenAI } from "@google/genai";
import { Pendencia, DashboardStats } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDashboardInsights = async (stats: DashboardStats, criticalIssues: Pendencia[]) => {
  try {
    const prompt = `
      Atue como um analista de logística sênior para a transportadora São Luiz Express.
      Analise os seguintes dados do dashboard de pendências (CTEs não baixados):
      
      Estatísticas Gerais:
      - Total Pendente: ${stats.total}
      - Vencidos (Crítico): ${stats.overdue}
      - Prioridade (Vence Hoje): ${stats.priority}
      - No Prazo: ${stats.onTime}
      
      Top Unidades com Pendências:
      ${JSON.stringify(stats.byUnit)}
      
      Status Recorrentes:
      ${JSON.stringify(stats.byStatus)}

      Existem ${criticalIssues.length} pendências críticas (muito atrasadas).

      Forneça:
      1. Uma análise breve da saúde atual das entregas.
      2. Três recomendações de ação imediata para o gestor.
      3. Identifique uma possível anomalia ou tendência preocupante.

      Responda em formato JSON com as chaves: "analysis", "recommendations" (array de strings), "anomaly".
      Mantenha o tom profissional e direto.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Insight Error:", error);
    return {
      analysis: "Não foi possível gerar a análise com IA no momento.",
      recommendations: ["Verifique manualmente as pendências vencidas.", "Contate as unidades com maior volume."],
      anomaly: "Erro na conexão com o serviço de inteligência."
    };
  }
};