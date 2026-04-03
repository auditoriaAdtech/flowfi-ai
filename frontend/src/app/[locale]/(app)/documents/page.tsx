'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Upload,
  FileText,
  FileImage,
  File,
  Trash2,
  Eye,
  ScanLine,
  Loader2,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react';

import { cn, formatDate } from '@/lib/utils';
import * as api from '@/lib/api';
import { useFetch, useMutation } from '@/hooks/useApi';
import type { Document } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('pdf')) return FileText;
  return File;
}

function typeBadgeColor(type: Document['type']) {
  switch (type) {
    case 'INVOICE':
      return 'bg-blue-100 text-blue-700';
    case 'RECEIPT':
      return 'bg-green-100 text-green-700';
    case 'STATEMENT':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function DocumentsPage() {
  const t = useTranslations('documents');
  const tc = useTranslations('common');

  const { data: documents, isLoading, error, refetch } = useFetch<Document[]>(
    () => api.getDocuments() as Promise<Document[]>,
    []
  );

  const [uploadType, setUploadType] = useState<string>('RECEIPT');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [detailDoc, setDetailDoc] = useState<Document | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadDoc = useMutation<unknown, [File, string]>((file, type) =>
    api.uploadDocument(file, type)
  );
  const deleteDoc = useMutation<void, [string]>((id) => api.deleteDocument(id));
  const ocrDoc = useMutation<unknown, [string]>((id) => api.runOcr(id));

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      for (const file of Array.from(files)) {
        await uploadDoc.mutate(file, uploadType);
      }
      refetch();
    },
    [uploadType, uploadDoc, refetch]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDelete = async (id: string) => {
    await deleteDoc.mutate(id);
    refetch();
  };

  const handleOcr = async (id: string) => {
    await ocrDoc.mutate(id);
    refetch();
    if (detailDoc && detailDoc.id === id) {
      const updated = documents?.find((d) => d.id === id);
      if (updated) setDetailDoc({ ...updated, processed: true });
    }
  };

  const filtered =
    filterType === 'ALL'
      ? documents ?? []
      : (documents ?? []).filter((d) => d.type === filterType);

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-lg border-2 border-dashed bg-muted/30" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{tc('error')}</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-4">
            <Select value={uploadType} onValueChange={setUploadType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INVOICE">{t('invoice')}</SelectItem>
                <SelectItem value="RECEIPT">{t('receipt')}</SelectItem>
                <SelectItem value="STATEMENT">{t('statement')}</SelectItem>
                <SelectItem value="OTHER">{t('other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors',
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploadDoc.isLoading ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
            <p className="mt-3 text-sm font-medium">{t('upload')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('uploadDescription')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="INVOICE">{t('invoice')}</SelectItem>
            <SelectItem value="RECEIPT">{t('receipt')}</SelectItem>
            <SelectItem value="STATEMENT">{t('statement')}</SelectItem>
            <SelectItem value="OTHER">{t('other')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <p className="text-center text-muted-foreground">{t('noDocuments')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => {
            const Icon = getFileIcon(doc.mimeType);
            return (
              <Card key={doc.id} className="group overflow-hidden transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-sm">{doc.fileName}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                    <Badge className={typeBadgeColor(doc.type)}>
                      {t(doc.type.toLowerCase() as 'invoice' | 'receipt' | 'statement' | 'other')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                  {doc.processed && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      OCR Processed
                    </Badge>
                  )}
                </CardContent>
                <CardFooter className="gap-1 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setDetailDoc(doc)}>
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                  {!doc.processed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOcr(doc.id)}
                      disabled={ocrDoc.isLoading}
                    >
                      <ScanLine className="mr-1 h-3 w-3" />
                      {t('ocr')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleteDoc.isLoading}
                    className="ml-auto text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Document Detail Dialog */}
      <Dialog open={!!detailDoc} onOpenChange={(open) => { if (!open) setDetailDoc(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {detailDoc?.fileName}
            </DialogTitle>
            <DialogDescription>
              {detailDoc && (
                <span className="flex items-center gap-2">
                  <Badge className={typeBadgeColor(detailDoc.type)}>
                    {t(detailDoc.type.toLowerCase() as 'invoice' | 'receipt' | 'statement' | 'other')}
                  </Badge>
                  <span>{formatFileSize(detailDoc.fileSize)}</span>
                  <span>{formatDate(detailDoc.createdAt)}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {detailDoc?.classification && (
              <div>
                <h4 className="text-sm font-medium">{t('classification')}</h4>
                <p className="text-sm text-muted-foreground">{detailDoc.classification}</p>
              </div>
            )}
            {detailDoc?.processed && detailDoc.ocrText ? (
              <div>
                <h4 className="mb-2 text-sm font-medium">{t('ocrResult')}</h4>
                <div className="max-h-64 overflow-auto rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
                  {detailDoc.ocrText}
                </div>
              </div>
            ) : (
              <div className="rounded-md bg-muted/50 p-6 text-center">
                <ScanLine className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Document has not been OCR processed yet.
                </p>
                {detailDoc && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => handleOcr(detailDoc.id)}
                    disabled={ocrDoc.isLoading}
                  >
                    {ocrDoc.isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ScanLine className="mr-2 h-4 w-4" />
                    )}
                    {t('ocr')}
                  </Button>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDoc(null)}>
              {tc('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
