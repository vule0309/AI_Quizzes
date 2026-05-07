import { create } from 'zustand';
import {
  GUEST_USER, GUEST_DOCUMENTS, GUEST_QUIZ, GUEST_FLASHCARDS, GUEST_QUIZ_MAP
} from './mockData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const useStore = create((set, get) => ({
  // --- Auth State ---
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, isGuest: false });
  },

  loginAsGuest: () => {
    set({
      user: GUEST_USER,
      token: 'guest-token',
      isAuthenticated: true,
      isGuest: true,
      documents: GUEST_DOCUMENTS,
      documentsLoading: false,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null, token: null, isAuthenticated: false, isGuest: false,
      documents: [], currentQuiz: null, quizAnswers: {}, quizResult: null,
      currentFlashcards: [], flashcardIndex: 0,
    });
  },

  initAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token, isAuthenticated: true, isGuest: false });
    }
  },

  // --- Documents ---
  documents: [],
  documentsLoading: false,

  fetchDocuments: async (forceRefresh = false) => {
    const { isGuest, documents, documentsLoading } = get();

    // Guest mode: đã có mock data
    if (isGuest) {
      if (documents.length === 0) set({ documents: GUEST_DOCUMENTS });
      return;
    }

    // Guard: không gọi lại nếu đang loading (trừ khi force)
    if (!forceRefresh && documentsLoading) return;

    set({ documentsLoading: true });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const token = get().token;
      const res = await fetch(`${API_BASE}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      set({ documents: data.documents || [], documentsLoading: false });
    } catch {
      clearTimeout(timeout);
      set({ documentsLoading: false });
    }
  },

  // --- Guest helpers ---
  getGuestQuizByDocId: (docId) => GUEST_QUIZ[docId] || null,
  getGuestFlashcardsByDocId: (docId) => GUEST_FLASHCARDS[docId] || [],
  getGuestQuizMap: () => GUEST_QUIZ_MAP,
  getGuestQuizById: (quizId) => {
    return Object.values(GUEST_QUIZ).find((q) => q.id === quizId) || null;
  },

  // --- Quiz State ---
  currentQuiz: null,
  quizAnswers: {},
  quizResult: null,

  setQuiz: (quiz) => set({ currentQuiz: quiz, quizAnswers: {}, quizResult: null }),
  setAnswer: (questionId, answer) =>
    set((state) => ({
      quizAnswers: { ...state.quizAnswers, [questionId]: answer },
    })),
  setQuizResult: (result) => set({ quizResult: result }),
  clearQuiz: () => set({ currentQuiz: null, quizAnswers: {}, quizResult: null }),

  // --- Flashcard State ---
  currentFlashcards: [],
  flashcardIndex: 0,

  setFlashcards: (cards) => set({ currentFlashcards: cards, flashcardIndex: 0 }),
  nextCard: () =>
    set((state) => ({
      flashcardIndex: Math.min(state.flashcardIndex + 1, state.currentFlashcards.length - 1),
    })),
  prevCard: () =>
    set((state) => ({
      flashcardIndex: Math.max(state.flashcardIndex - 1, 0),
    })),
}));

export { API_BASE };
export default useStore;
