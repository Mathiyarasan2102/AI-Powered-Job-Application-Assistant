import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useJobStore = create(
  persist(
    (set) => ({
      jobData: null,
      generatedResume: null,
      generatedEmail: null,
      generatedCoverLetter: null,
      pdfUrl: null,
      score: null,
      matchedKeywords: [],
      missingKeywords: [],
      history: [],
      loading: false,
      historyLoading: false,

      parseJob: async (formData) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/job/parse-job', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          set({ jobData: data.jobData, loading: false });
          return data.jobData;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      generateApplication: async (jobData, options = {}) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/job/generate-application', { jobData, options });
          set({ 
            generatedResume: data.resumeData, 
            generatedEmail: data.email,
            generatedCoverLetter: data.coverLetter,
            pdfUrl: data.pdfUrl,
            score: data.score,
            matchedKeywords: data.matchedKeywords || [],
            missingKeywords: data.missingKws || [],
            loading: false 
          });
          return data;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      batchMatch: async (formData) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/job/batch-match', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          set({ loading: false });
          return data;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },


      fetchHistory: async () => {
        set({ historyLoading: true });
        try {
          const { data } = await api.get('/job/history');
          set({ history: data.resumes || [], historyLoading: false });
        } catch (error) {
          set({ historyLoading: false });
          throw error;
        }
      },

      deleteResume: async (id) => {
        try {
          await api.delete(`/job/resume/${id}`);
          set(state => ({
            history: state.history.filter(r => r._id !== id)
          }));
        } catch (error) {
          throw error;
        }
      },

      loadFromHistory: (resume) => {
        set({
          jobData: {
            job_title: resume.jobTitle || '',
            company_name: resume.companyName || '',
            skills_required: resume.matchedKeywords || [],
            keywords: [...(resume.matchedKeywords || []), ...(resume.missingKeywords || [])]
          },
          generatedResume: resume.contentJson,
          generatedEmail: resume.emailSubject ? { subject: resume.emailSubject, body: resume.emailDraft } : null,
          generatedCoverLetter: resume.coverLetterDraft || null,
          pdfUrl: resume.pdfFile ? `/uploads/pdfbuilds/${resume.pdfFile}` : null,
          score: resume.keywordScore,
          matchedKeywords: resume.matchedKeywords || [],
          missingKeywords: resume.missingKeywords || [],
        });
      },

      regeneratePdf: async (id, resumeData) => {
        try {
          const { data } = await api.post(`/job/regenerate-pdf/${id}`, { resumeData });
          return data;
        } catch (error) {
          throw error;
        }
      },
      
      reset: () => set({
        jobData: null,
        generatedResume: null,
        generatedEmail: null,
        generatedCoverLetter: null,
        pdfUrl: null,
        score: null,
        matchedKeywords: [],
        missingKeywords: []
      })
    }),
    {
      name: 'job-storage',
      partialize: (state) => ({
        jobData: state.jobData,
        generatedResume: state.generatedResume,
        generatedEmail: state.generatedEmail,
        generatedCoverLetter: state.generatedCoverLetter,
        pdfUrl: state.pdfUrl,
        score: state.score,
        matchedKeywords: state.matchedKeywords,
        missingKeywords: state.missingKeywords
      })
    }
  )
);
