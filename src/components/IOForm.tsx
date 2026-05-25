import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { parseCustomDate } from '../utils/dateParser';
import { compressImage } from '../utils/imageCompressor';
import { ioApi } from '../api/io';
import { api } from '../api';
import type { IOData, UIFile } from '../types/io.types';
import type { InfoObjectDTO, MediaFileDTO } from '../types/dto.types';

interface IOFormProps {
  ioId?: string;
}

interface PendingFile {
  id: string;
  file: File;
}

export const IOForm = ({ ioId }: IOFormProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<IOData>({
    title: '', text: '', source: '', url: '', author: '', doi: '', publicationName: '',
    dateFrom: '', dateTo: '', tags: [], attachments: []
  });

  const [tagsInput, setTagsInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved'>(ioId ? 'loading' : 'idle');
  const [uiFiles, setUiFiles] = useState<UIFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (ioId) {
      Promise.all([
        ioApi.getIO(ioId),
        ioApi.getFiles(ioId).catch(() => ({ data: [] }))
      ]).then(([ioRes, filesRes]) => {
        const apiData = ioRes.data as unknown as InfoObjectDTO;
        const fetchedFiles = Array.isArray(filesRes.data) ? filesRes.data : [];
        const mappedTags = apiData.tags ? (apiData.tags as unknown as string[]) : [];

        setFormData({
          title: apiData.title || '',
          text: apiData.content || '',
          source: apiData.source || '',
          url: apiData.url || '',
          author: apiData.author || '',
          doi: apiData.doi || '',
          publicationName: apiData.publication_title || '',
          dateFrom: apiData.publication_date_from || '',
          dateTo: apiData.publication_date_to || '',
          tags: mappedTags,
          attachments: []
        });

        setTagsInput(mappedTags.join('\n'));

        if (fetchedFiles.length > 0) {
          setUiFiles(fetchedFiles.map((f: MediaFileDTO) => ({
            id: String(f.id),
            name: f.original_name || f.stored_name || 'file'
          })));
        }
        setStatus('idle');
      }).catch(() => {
        setStatus('idle');
      });
    }
  }, [ioId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: IOData) => ({ ...prev, [name]: value }));
  };

  const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isEnd = name === 'dateTo';
    const parsed = parseCustomDate(value, isEnd);
    setFormData((prev: IOData) => ({ ...prev, [name]: parsed }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTagsInput(value);
    const tags = value.split(/[,\n]+/).map(t => t.trim()).filter(t => t !== '').slice(0, 30);
    setFormData((prev: IOData) => ({ ...prev, tags }));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const currentCount = uiFiles.length;
    const filesArray = Array.from(files).slice(0, 3 - currentCount);
    
    for (const file of filesArray) {
      let fileToUpload = file;
      
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressImage(file);
          fileToUpload = new File([compressed as Blob], file.name, { type: file.type });
        } catch(err) {
          console.error(err);
        }
      }

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      setPendingFiles(prev => [...prev, { id: tempId, file: fileToUpload }]);
      setUiFiles(prev => [...prev, { id: tempId, name: fileToUpload.name }]);
    }
  };

  const removeFile = async (idToRemove: string) => {
    if (idToRemove.startsWith('temp-')) {
      setPendingFiles(prev => prev.filter(f => f.id !== idToRemove));
      setUiFiles(prev => prev.filter(f => f.id !== idToRemove));
    } else if (ioId) {
      try {
        await api.delete(`/files/info-objects/${ioId}/${idToRemove}`);
        setUiFiles(prev => prev.filter(f => f.id !== idToRemove));
      } catch(err) {
        console.error(err);
        setStatus('idle');
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');

    const apiPayload = {
      title: formData.title,
      content: formData.text,
      source: formData.source || null,
      author: formData.author || null,
      url: formData.url || null,
      doi: formData.doi || null,
      tags: formData.tags,
      publication_title: formData.publicationName || null,
      publication_date_from_raw: formData.dateFrom || '',
      publication_date_to_raw: formData.dateTo || '',
      publication_date_raw: formData.dateFrom || formData.dateTo || 'Не указано',
      publication_date: new Date().toISOString() 
    };

    try {
      let targetIoId = ioId;
      
      if (targetIoId) {
        await ioApi.updateIO(targetIoId, apiPayload as unknown as IOData);
        alert(t('io_form.success_edit'));
      } else {
        const res = await ioApi.createIO(apiPayload as unknown as IOData);
        const responseData = res.data as unknown as Record<string, unknown>;
        targetIoId = String(responseData.info_id || responseData.id);
        alert(t('io_form.success_create'));
      }

      if (pendingFiles.length > 0) {
        const filesToUpload = pendingFiles.map(pf => pf.file);
        await ioApi.uploadFiles(targetIoId!, filesToUpload);
      }

      setPendingFiles([]);
      const time = new Date().toLocaleTimeString();
      setLastSaved(time);
      setStatus('saved');
      
      if (targetIoId) {
        navigate(`/io/view/${targetIoId}`);
      }
    } catch {
      setStatus('idle');
    }
  };

  if (status === 'loading') {
    return <div className="text-center p-6 text-gray-600">{t('io_form.loading')}</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          {ioId ? t('io_form.title_edit') : t('io_form.title_create')}
        </h1>
        <div className="text-xs md:text-sm">
          {status === 'saving' && <span className="text-blue-500">{t('io_form.saving')}</span>}
          {status === 'saved' && <span className="text-green-500">{t('io_form.saved', { time: lastSaved })}</span>}
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t('io_form.fields.title')} <span className="text-red-500">*</span></label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t('io_form.fields.text')} <span className="text-red-500">*</span></label>
            <textarea name="text" required value={formData.text} onChange={handleChange} rows={5} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">{t('io_form.fields.source')}</label>
            <input type="text" name="source" value={formData.source} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">{t('io_form.fields.author')}</label>
            <input type="text" name="author" value={formData.author} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">{t('io_form.fields.url')}</label>
            <input type="url" name="url" value={formData.url} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">{t('io_form.fields.doi')}</label>
            <input type="text" name="doi" value={formData.doi} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t('io_form.fields.publicationName')}</label>
            <input type="text" name="publicationName" value={formData.publicationName} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">{t('io_form.fields.dateFrom')}</label>
            <input type="text" name="dateFrom" value={formData.dateFrom} onChange={handleChange} onBlur={handleDateBlur} placeholder="YYYY" className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">{t('io_form.fields.dateTo')}</label>
            <input type="text" name="dateTo" value={formData.dateTo} onChange={handleChange} onBlur={handleDateBlur} placeholder="YYYY" className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t('io_form.fields.tags')}</label>
            <textarea value={tagsInput} onChange={handleTagsChange} rows={3} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('io_form.fields.tags_placeholder')} />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{t('io_form.fields.attachments')}</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              className={`mt-2 border-2 border-dashed p-6 rounded-lg text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
            >
              <p className="text-gray-600 text-sm md:text-base">{t('io_form.dnd.text')}</p>
              <input type="file" multiple className="hidden" id="file-upload" onChange={(e) => handleFiles(e.target.files)} />
              <label htmlFor="file-upload" className="mt-3 inline-block px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md cursor-pointer hover:bg-gray-300 transition-colors">
                {t('io_form.dnd.button')}
              </label>
            </div>
            
            {uiFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uiFiles.map((file) => (
                  <div key={file.id} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded-md">
                    <span className="text-sm text-gray-700 truncate mr-2">{file.name}</span>
                    <button type="button" onClick={() => removeFile(file.id)} className="text-red-500 hover:text-red-700 font-bold px-2 shrink-0">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button type="submit" disabled={status === 'saving'} className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors shadow-sm">
            {ioId ? t('io_form.submit_edit') : t('io_form.submit_create')}
          </button>
        </div>
      </form>
    </div>
  );
};