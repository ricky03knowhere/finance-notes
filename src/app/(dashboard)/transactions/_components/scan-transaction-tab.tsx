'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ImagePlus, Loader2, ScanLine, Trash2, Upload, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { TransactionOption } from '@/features/transaction/transaction.types';
import { cn } from '@/lib/utils';

export interface ScannedRow {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  note: string;
  categoryId: string;
}

type ScanTransactionTabProps = {
  wallets: TransactionOption[];
  categories: TransactionOption[];
  onBatchSubmit: (
    rows: ScannedRow[],
    config: { walletId: string; transactionDate: string },
  ) => Promise<{ success: number; failed: number }>;
  onClose: () => void;
  onBusyChange?: (busy: boolean) => void;
};

type ScanState = 'idle' | 'scanning' | 'preview' | 'submitting' | 'done';

function toLocalDateTimeValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function deduplicateRows(rows: ScannedRow[]): ScannedRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.type}|${row.amount}|${row.note.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function ScanTransactionTab({ wallets, categories, onBatchSubmit, onClose, onBusyChange }: ScanTransactionTabProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rows, setRows] = useState<ScannedRow[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitTotal, setSubmitTotal] = useState(0);
  const [submitResult, setSubmitResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [removedDuplicates, setRemovedDuplicates] = useState(0);

  // Batch config
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? '');
  const [transactionDate, setTransactionDate] = useState(toLocalDateTimeValue());

  const isBusy = scanState === 'scanning' || scanState === 'submitting';

  // Categories filtered by type for each row
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'INCOME'),
    [categories],
  );
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'EXPENSE'),
    [categories],
  );

  function getCategoriesForType(type: 'INCOME' | 'EXPENSE') {
    return type === 'INCOME' ? incomeCategories : expenseCategories;
  }

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (PNG, JPG, dll)');
      return;
    }

    setError(null);
    setRemovedDuplicates(0);
    setPreviewUrl(URL.createObjectURL(file));
    setScanState('scanning');
    setScanProgress(10);
    onBusyChange?.(true);

    const progressInterval = window.setInterval(() => {
      setScanProgress((prev) => Math.min(prev + Math.random() * 15, 90));
    }, 400);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/transactions/scan', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Gagal memindai gambar');
      }

      const data = (await response.json()) as { rows: Array<{ type: 'INCOME' | 'EXPENSE'; amount: number; note: string }> };

      if (data.rows.length === 0) {
        throw new Error('Tidak ditemukan data transaksi pada gambar');
      }

      // Add default categoryId and deduplicate
      const rawRows: ScannedRow[] = data.rows.map((r) => ({
        ...r,
        categoryId: '',
      }));

      const deduplicated = deduplicateRows(rawRows);
      const dupeCount = rawRows.length - deduplicated.length;

      setRows(deduplicated);
      setRemovedDuplicates(dupeCount);
      setScanState('preview');
      onBusyChange?.(false);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Gagal memindai gambar');
      setScanState('idle');
      setScanProgress(0);
      onBusyChange?.(false);
    }
  }, [onBusyChange]);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  function updateRow(index: number, field: keyof ScannedRow, value: string | number) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        if (field === 'amount') {
          return { ...row, amount: Math.abs(Number(value)) };
        }

        if (field === 'type') {
          // Reset categoryId when type changes since categories differ
          return { ...row, type: value as 'INCOME' | 'EXPENSE', categoryId: '' };
        }

        return { ...row, [field]: value };
      }),
    );
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function resetScan() {
    setScanState('idle');
    setPreviewUrl(null);
    setRows([]);
    setScanProgress(0);
    setSubmitProgress(0);
    setSubmitResult(null);
    setError(null);
    setRemovedDuplicates(0);
    onBusyChange?.(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleBatchInput() {
    if (rows.length === 0 || !walletId) return;

    setScanState('submitting');
    setSubmitTotal(rows.length);
    setSubmitProgress(0);
    onBusyChange?.(true);

    const result = await onBatchSubmit(rows, { walletId, transactionDate });

    setSubmitProgress(rows.length);
    setSubmitResult(result);
    setScanState('done');
    onBusyChange?.(false);
  }

  return (
    <div className="grid gap-5">
      {/* Upload area */}
      <AnimatePresence mode="wait">
        {scanState === 'idle' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div
              className={cn(
                'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30',
              )}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="rounded-2xl bg-primary/10 p-3">
                <ImagePlus className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag & drop gambar tabel di sini</p>
                <p className="mt-1 text-xs text-muted-foreground">atau klik untuk memilih file</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Pilih Gambar
              </Button>
              <input
                ref={fileRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                type="file"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400"
              >
                <XCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Scanning progress */}
        {scanState === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {previewUrl && (
              <div className="overflow-hidden rounded-2xl border border-border">
                <img
                  alt="Preview gambar"
                  className="h-40 w-full object-cover"
                  src={previewUrl}
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ScanLine className="h-4 w-4 animate-pulse text-primary" />
                <span className="text-sm font-medium">Memindai gambar...</span>
                <span className="text-xs text-muted-foreground">{Math.round(scanProgress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Preview & edit */}
        {(scanState === 'preview' || scanState === 'submitting') && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Scanned image preview small */}
            {previewUrl && (
              <div className="overflow-hidden rounded-2xl border border-border">
                <img alt="Gambar sumber" className="h-24 w-full object-cover opacity-60" src={previewUrl} />
              </div>
            )}

            {/* Result count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">
                  {rows.length} baris ditemukan
                  {removedDuplicates > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({removedDuplicates} duplikat dihapus)
                    </span>
                  )}
                </span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={resetScan} disabled={scanState === 'submitting'}>
                Scan Ulang
              </Button>
            </div>

            {/* Editable table */}
            <div className="max-h-64 overflow-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tipe</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nominal</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Catatan</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kategori</th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row, idx) => {
                    const rowCategories = getCategoriesForType(row.type);

                    return (
                      <tr key={idx} className="transition-colors hover:bg-muted/30">
                        <td className="px-3 py-1.5">
                          <select
                            className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                            disabled={scanState === 'submitting'}
                            value={row.type}
                            onChange={(e) => updateRow(idx, 'type', e.target.value)}
                          >
                            <option value="INCOME">Income</option>
                            <option value="EXPENSE">Expense</option>
                          </select>
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                            disabled={scanState === 'submitting'}
                            min={0}
                            type="number"
                            value={row.amount}
                            onChange={(e) => updateRow(idx, 'amount', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                            disabled={scanState === 'submitting'}
                            value={row.note}
                            onChange={(e) => updateRow(idx, 'note', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <select
                            className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                            disabled={scanState === 'submitting'}
                            value={row.categoryId}
                            onChange={(e) => updateRow(idx, 'categoryId', e.target.value)}
                          >
                            <option value="">Pilih kategori</option>
                            {rowCategories.map((c) => (
                              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40"
                            disabled={scanState === 'submitting'}
                            onClick={() => removeRow(idx)}
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Batch config — wallet & date */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs" htmlFor="scan-wallet">Wallet</Label>
                <select
                  className="h-9 rounded-xl border border-border bg-background px-3 text-xs shadow-sm outline-none focus:ring-1 focus:ring-ring"
                  disabled={scanState === 'submitting'}
                  id="scan-wallet"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                >
                  <option value="">Pilih wallet</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs" htmlFor="scan-date">Tanggal</Label>
                <input
                  className="h-9 rounded-xl border border-border bg-background px-3 text-xs shadow-sm outline-none focus:ring-1 focus:ring-ring"
                  disabled={scanState === 'submitting'}
                  id="scan-date"
                  type="datetime-local"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                />
              </div>
            </div>

            {/* Submit progress */}
            {scanState === 'submitting' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">
                    Menyimpan transaksi... {submitProgress}/{submitTotal}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{ width: `${submitTotal > 0 ? (submitProgress / submitTotal) * 100 : 0}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Done state */}
        {scanState === 'done' && submitResult && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-emerald-500/5 p-6 text-center">
              <div className="rounded-full bg-emerald-500/10 p-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-semibold">Batch Input Selesai</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {submitResult.success} berhasil
                  {submitResult.failed > 0 && `, ${submitResult.failed} gagal`}
                </p>
              </div>
            </div>

            {/* Full progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-full rounded-full bg-emerald-500" />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={resetScan}>
                Scan Lagi
              </Button>
              <Button type="button" className="flex-1" onClick={onClose}>
                Selesai
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      {scanState === 'preview' && (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            disabled={rows.length === 0 || !walletId}
            onClick={() => void handleBatchInput()}
          >
            <ScanLine className="h-4 w-4" />
            Input Semua ({rows.length} transaksi)
          </Button>
        </div>
      )}
    </div>
  );
}
