import fs from "fs";
import path from "path";

export class AiRouterService {
  private static apiKey: string | null = null;
  private static baseUrl = process.env.ROUTER_BASE_URL || "http://localhost:20128/v1";
  private static model = process.env.ROUTER_MODEL || "combogravuty";

  public static getApiKey(): string {
    if (this.apiKey) return this.apiKey;
    if (process.env.ROUTER_API_KEY) {
      this.apiKey = process.env.ROUTER_API_KEY;
      return this.apiKey;
    }

    // Ambil otomatis dari ~/.hermes/.env jika ada
    const hermesEnvPath = path.join(process.env.HOME || "/Users/apple", ".hermes", ".env");
    if (fs.existsSync(hermesEnvPath)) {
      try {
        const content = fs.readFileSync(hermesEnvPath, "utf-8");
        const match = content.match(/HERMES_CUSTOM_LOCALHOST_20128_API_KEY=(.*)/);
        if (match && match[1]) {
          this.apiKey = match[1].trim();
          return this.apiKey;
        }
      } catch (e) {
        console.error("Gagal membaca .env hermes:", e);
      }
    }
    return "";
  }

  public static async generateResponse(
    systemPrompt: string,
    history: { sender: string; content: string }[],
    newPrompt: string
  ): Promise<string> {
    const apiKey = this.getApiKey();
    const messages = [
      {
        role: "system",
        content: `${systemPrompt}\n\nInstruksi Penting: Kamu sedang berbicara langsung secara personal 1-on-1 dengan CEO / Founder (Pak Nyons). Tanggapi secara cerdas, profesional, solutif, langsung to the point, dan gunakan Bahasa Indonesia yang santai tapi hormat.`,
      },
      ...history.slice(-12).map((m) => ({
        role: m.sender === "CEO" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: newPrompt },
    ];

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          messages,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`9router HTTP ${res.status}: ${errText}`);
      }

      const data: any = await res.json();
      return (
        data.choices?.[0]?.message?.content ||
        "Siap Pak CEO, instruksi diterima. Sedang saya persiapkan detail teknisnya."
      );
    } catch (err: any) {
      console.error("Error memanggil 9router model combogravuty:", err.message);
      // Fallback pesan ramah jika 9router sedang offline
      return `[9router Offline] Siap Pak CEO! Saya mencatat arahan: "${newPrompt}". Segera saya proses.`;
    }
  }
}
