export type TranslationStatusResponse = {
  language: string;
  status: string;
};

export type UploadAudioResponse = {
  id: string;
  name: string;
  status: string;
  language: string;
  created_at: number;
  public_url: string;
};

export type TranscriptionStatusResponse = {
  id: string;
  name: string;
  duration: number;
  language: string;
  video: boolean;
  status: string;
  created_at: number;
  folder: {
    name: string;
    id: string;
  };
};

export type TranscriptionResultResponse = string;

// https://sonix.ai/docs/api#languages
export type SupportedLanguage =
  | 'en'
  | 'fr'
  | 'de'
  | 'es'
  | 'ar'
  | 'hy-AM'
  | 'bg'
  | 'ca'
  | 'hr'
  | 'yue-Hant-HK'
  | 'cmn-Hans-CN'
  | 'cs'
  | 'da'
  | 'nl'
  | 'fi'
  | 'el'
  | 'he-IL'
  | 'hi'
  | 'hu'
  | 'id-ID'
  | 'it'
  | 'ja'
  | 'ko'
  | 'lv'
  | 'lt'
  | 'ms-MY'
  | 'nb-NO'
  | 'pl'
  | 'pt'
  | 'ro'
  | 'ru'
  | 'sk'
  | 'sl'
  | 'sv'
  | 'th-TH'
  | 'tr-TR'
  | 'vi-VN'
  | 'uk';
