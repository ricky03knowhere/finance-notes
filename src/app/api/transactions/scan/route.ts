import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';

interface ScannedRow {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  note: string;
}

const GEMINI_PROMPT = `You are an OCR assistant that extracts financial data from images of expense/income tables.

Analyze the image and extract all rows from the table. The table typically has columns like "Income", "Spend"/"Expense", and "Notes".

Return ONLY a valid JSON array of objects with this exact structure:
[
  { "type": "INCOME", "amount": 5000000, "note": "" },
  { "type": "EXPENSE", "amount": 400000, "note": "Mom" }
]

Rules:
- For rows in the "Income" column, use type "INCOME"
- For rows in the "Spend"/"Expense" column, use type "EXPENSE"
- Amount must be a plain integer number without currency symbols, dots, commas, or separators (e.g. "Rp400,000" -> 400000)
- If note is empty, use empty string ""
- Skip header rows, summary rows like "Left", and total rows
- Output ALL valid rows found in the table.
- NEVER include ellipses like "...", comments, or placeholders in the output.`;

export async function POST(request: Request) {
  await requireUser();

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY belum dikonfigurasi di environment variables' },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Gambar wajib diunggah' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'image/png';

    const PREFERRED_MODELS = [
      'gemini-flash-latest',
      'gemini-3.6-flash',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
    ];

    const IGNORED_KEYWORDS = [
      'tts',
      'embedding',
      'imagen',
      'veo',
      'aqa',
      'lyria',
      'gemma',
      'computer-use',
      'deep-research',
      'robotics',
    ];

    let discoveredModels: string[] = [];

    try {
      const listModelsRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      );
      if (listModelsRes.ok) {
        const listData = await listModelsRes.json();
        const availableModels: Array<{ name: string; supportedGenerationMethods?: string[] }> =
          listData?.models ?? [];

        discoveredModels = availableModels
          .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m) => m.name.replace(/^models\//, ''))
          .filter((name) => !IGNORED_KEYWORDS.some((kw) => name.includes(kw)));
      }
    } catch {
      // Ignore list error
    }

    // Combine preferred models first, then any remaining discovered models without duplicates
    const candidateModels = Array.from(
      new Set([...PREFERRED_MODELS, ...discoveredModels]),
    );

    let geminiResponse: Response | null = null;
    let lastErrorMessage = '';

    for (const model of candidateModels) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      try {
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: GEMINI_PROMPT },
                  {
                    inlineData: {
                      mimeType,
                      data: base64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (res.ok) {
          geminiResponse = res;
          break;
        } else {
          const errorText = await res.text();
          try {
            const errorJson = JSON.parse(errorText);
            lastErrorMessage = errorJson?.error?.message || errorText;
          } catch {
            lastErrorMessage = errorText;
          }
          console.warn(`Gemini model ${model} failed:`, lastErrorMessage);
        }
      } catch (err) {
        lastErrorMessage = err instanceof Error ? err.message : 'Network fetch error';
        console.warn(`Gemini model ${model} fetch exception:`, lastErrorMessage);
      }
    }

    if (!geminiResponse) {
      console.error('Gemini API error (all models failed):', lastErrorMessage);
      return NextResponse.json(
        { error: `Gagal memproses gambar dari Gemini API: ${lastErrorMessage || 'Pastikan API Key valid.'}` },
        { status: 502 },
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: '[Gemini API Response Error] Gemini API berhasil dipanggil tetapi tidak mengembalikan hasil teks dari gambar.' },
        { status: 422 },
      );
    }

    // Extract JSON content
    const jsonMatch = rawText.match(/\[[\s\S]*\]/) || rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('Gemini Raw Output (no JSON match):', rawText);
      const snippet = rawText.length > 120 ? `${rawText.slice(0, 120)}...` : rawText;
      return NextResponse.json(
        {
          error: `[Parsing Error] Gemini tidak menghasilkan format JSON. Teks yang diterima: "${snippet}"`,
          rawOutput: rawText,
        },
        { status: 422 },
      );
    }

    // Sanitize common Gemini JSON output flaws (ellipses, trailing commas)
    const cleanJson = jsonMatch[0]
      .replace(/,\s*\.\.\.\s*\]/g, ']')
      .replace(/\.\.\./g, '')
      .replace(/,\s*([\]}])/g, '$1');

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      // Fallback parser: extract individual valid JSON objects
      const objectMatches = cleanJson.match(/\{[^{}]*\}/g);
      if (objectMatches) {
        parsed = objectMatches
          .map((objStr) => {
            try {
              return JSON.parse(objStr);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
      }
    }

    // Handle object with a "rows" or "transactions" property
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.rows)) {
        parsed = obj.rows;
      } else if (Array.isArray(obj.transactions)) {
        parsed = obj.transactions;
      } else if (Array.isArray(obj.data)) {
        parsed = obj.data;
      }
    }

    if (!parsed || (!Array.isArray(parsed) && typeof parsed !== 'object')) {
      const snippet = cleanJson.length > 120 ? `${cleanJson.slice(0, 120)}...` : cleanJson;
      return NextResponse.json(
        {
          error: `[Parsing Error] Gagal memproses struktur JSON dari hasil scan. Teks: "${snippet}"`,
          rawOutput: rawText,
        },
        { status: 422 },
      );
    }

    const rawArray = Array.isArray(parsed) ? parsed : [parsed];

    const rows: ScannedRow[] = rawArray
      .filter(
        (row: unknown): row is { type?: string; amount?: number | string; note?: string } =>
          typeof row === 'object' &&
          row !== null &&
          ('amount' in row || 'type' in row || 'note' in row),
      )
      .map((row) => {
        const typeStr = String(row.type || 'EXPENSE').toUpperCase();
        const type = typeStr.includes('INC') || typeStr.includes('MASUK') ? ('INCOME' as const) : ('EXPENSE' as const);
        const amountNum = Math.abs(Number(String(row.amount || '0').replace(/[^0-9.]/g, '')));

        return {
          type,
          amount: isNaN(amountNum) ? 0 : amountNum,
          note: typeof row.note === 'string' ? row.note : String(row.note ?? ''),
        };
      })
      .filter((row) => row.amount > 0);

    if (rows.length === 0) {
      const snippet = rawText.length > 120 ? `${rawText.slice(0, 120)}...` : rawText;
      return NextResponse.json(
        {
          error: `[Data Extraction Error] Tidak ada baris transaksi valid yang ditemukan pada gambar. Output mentah Gemini: "${snippet}"`,
          rawOutput: rawText,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ rows });
  } catch (error) {
    console.error('Scan transaction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? `[System Error] ${error.message}` : '[System Error] Gagal memindai gambar' },
      { status: 500 },
    );
  }
}
