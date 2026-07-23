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

    // Dynamically discover supported models for this API key via ListModels
    let candidateModels: string[] = [];

    try {
      const listModelsRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      );
      if (listModelsRes.ok) {
        const listData = await listModelsRes.json();
        const availableModels: Array<{ name: string; supportedGenerationMethods?: string[] }> =
          listData?.models ?? [];

        candidateModels = availableModels
          .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m) => m.name.replace(/^models\//, ''));
      }
    } catch {
      // Ignore list error and fallback to default candidate list
    }

    // Default fallbacks if ListModels didn't yield models
    if (candidateModels.length === 0) {
      candidateModels = [
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-002',
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro',
      ];
    }

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

    // Extract JSON content
    const jsonMatch = rawText.match(/\[[\s\S]*\]/) || rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Tidak dapat menemukan data tabel dari gambar. Coba gunakan gambar yang lebih jelas.' },
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

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json(
        { error: 'Format hasil scan tidak valid atau tidak menemukan transaksi' },
        { status: 422 },
      );
    }

    const rows: ScannedRow[] = parsed
      .filter(
        (row: unknown): row is { type: string; amount: number; note: string } =>
          typeof row === 'object' &&
          row !== null &&
          'type' in row &&
          'amount' in row,
      )
      .map((row) => ({
        type: row.type === 'INCOME' ? ('INCOME' as const) : ('EXPENSE' as const),
        amount: Math.abs(Number(row.amount)),
        note: typeof row.note === 'string' ? row.note : '',
      }))
      .filter((row) => row.amount > 0);

    return NextResponse.json({ rows });
  } catch (error) {
    console.error('Scan transaction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memindai gambar' },
      { status: 500 },
    );
  }
}
