import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';
import {
  MAX_WAIT_TIME,
  RECOGNITION_POLLING_DELAY,
  SPEECH_BASE_URL,
} from './constants';
import {
  SpeechToTextRequest,
  SpeechToTextResponse,
  SupportedLanguage,
  TranscriptionResultResponse,
  TranscriptionStatusResponse,
  TranslateTranscriptionRequest,
  TranslateTranscriptionResponse,
  TranslationStatusResponse,
  UploadAudioResponse,
} from './types';

interface ISonixSpeechRecognitionService {
  speechToText(request: SpeechToTextRequest): Promise<SpeechToTextResponse>;
  translateTranscription(
    request: TranslateTranscriptionRequest
  ): Promise<TranslateTranscriptionResponse>;
}

export class SonixSpeechRecognitionService
  implements ISonixSpeechRecognitionService
{
  constructor(private readonly authKey: string) {}

  private async uploadFileForTranscription({
    audioUrl,
    audioFilePath,
    fileName,
    language,
  }: SpeechToTextRequest): Promise<UploadAudioResponse> {
    if (!audioUrl && !audioFilePath) {
      throw new Error('Either audioUrl or audioFilePath must be provided');
    }

    const form = new FormData();

    if (audioUrl) {
      form.append('file_url', audioUrl);
    }

    if (audioFilePath) {
      const fileStream = fs.createReadStream(audioFilePath);
      form.append('file', fileStream, fileName);
    }

    form.append('language', language);
    if (fileName) {
      form.append('name', fileName);
    }

    const response = await axios.post(SPEECH_BASE_URL, form, {
      headers: {
        Authorization: `Bearer ${this.authKey}`,
      },
    });

    return response.data as UploadAudioResponse;
  }

  private async getTranscriptionStatus(
    uploadAudioResponse: UploadAudioResponse
  ): Promise<TranscriptionStatusResponse> {
    const response = await axios.request({
      method: 'get',
      maxBodyLength: Infinity,
      url: `${SPEECH_BASE_URL}/${uploadAudioResponse.id}`,
      headers: {
        Authorization: `Bearer ${this.authKey}`,
      },
    });

    return response.data as TranscriptionStatusResponse;
  }

  private async getTranscriptionResult(
    transcriptionId: string,
    language: SupportedLanguage
  ): Promise<TranscriptionResultResponse> {
    const form = new FormData();

    form.append('language', language);

    const response = await axios.get(
      `${SPEECH_BASE_URL}/${transcriptionId}/transcript`,
      {
        headers: {
          Authorization: `Bearer ${this.authKey}`,
        },
        data: form,
      }
    );

    return response.data as TranscriptionResultResponse;
  }

  private async queueTranslation({
    transcriptionJobId,
    language,
  }: TranslateTranscriptionRequest): Promise<TranslationStatusResponse> {
    const form = new FormData();

    form.append('language', language);

    const response = await axios.post(
      `${SPEECH_BASE_URL}/${transcriptionJobId}/translations`,
      form,
      {
        headers: {
          Authorization: `Bearer ${this.authKey}`,
        },
      }
    );

    return response.data as TranslationStatusResponse;
  }

  private async getTranslationStatus({
    transcriptionJobId,
    language,
  }: TranslateTranscriptionRequest): Promise<TranslationStatusResponse> {
    const response = await axios.request({
      method: 'get',
      maxBodyLength: Infinity,
      url: `${SPEECH_BASE_URL}/${transcriptionJobId}/translations/${language}`,
      headers: {
        Authorization: `Bearer ${this.authKey}`,
      },
    });

    return response.data as TranslationStatusResponse;
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async speechToText({
    audioUrl,
    fileName,
    language,
    audioFilePath,
  }: SpeechToTextRequest): Promise<SpeechToTextResponse> {
    let jobId = '';
    try {
      const fileUploadResponse = await this.uploadFileForTranscription({
        audioUrl,
        fileName,
        language,
        audioFilePath,
      });

      jobId = fileUploadResponse.id;

      const startTime = Date.now();

      let transcriptionStatus = await this.getTranscriptionStatus(
        fileUploadResponse
      );

      while (transcriptionStatus.status !== 'completed') {
        if (Date.now() - startTime > MAX_WAIT_TIME) {
          throw new Error('Transcription timeout');
        }

        await this.delay(RECOGNITION_POLLING_DELAY);
        transcriptionStatus = await this.getTranscriptionStatus(
          fileUploadResponse
        );

        if (transcriptionStatus.status === 'duplicate') {
          if (!transcriptionStatus.duplicate_media_id) {
            throw new Error(
              'Sonix returned failed status and duplicate media id is not provided. Please check portal https://my.sonix.ai/ for more details'
            );
          }

          const duplicateMediaId = transcriptionStatus.duplicate_media_id;
          transcriptionStatus = {
            ...transcriptionStatus,
            id: duplicateMediaId,
          };
          break;
        }

        if (transcriptionStatus.status === 'failed') {
          throw new Error(
            'Sonix returned failed status. Please check portal https://my.sonix.ai/ for more details'
          );
        }
      }

      const transcription = await this.getTranscriptionResult(
        transcriptionStatus.id,
        language
      );

      return {
        jobId: transcriptionStatus.id,
        text: transcription,
        status: 'completed',
      };
    } catch (error) {
      return {
        jobId,
        text: '',
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  async translateTranscription(
    request: TranslateTranscriptionRequest
  ): Promise<TranslateTranscriptionResponse> {
    try {
      await this.queueTranslation(request);
      const startTime = Date.now();

      let translationStatus = await this.getTranslationStatus(request);

      while (translationStatus.status !== 'completed') {
        if (Date.now() - startTime > MAX_WAIT_TIME) {
          throw new Error('Transcription timeout');
        }

        await this.delay(RECOGNITION_POLLING_DELAY);
        translationStatus = await this.getTranslationStatus(request);

        if (translationStatus.status === 'failed') {
          throw new Error(
            'Sonix returned failed status. Please check portal https://my.sonix.ai/ for more details'
          );
        }
      }

      const transcriptionEnglish = await this.getTranscriptionResult(
        request.transcriptionJobId,
        request.language
      );

      return {
        jobId: request.transcriptionJobId,
        text: transcriptionEnglish,
        status: 'completed',
      };
    } catch (error) {
      return {
        jobId: request.transcriptionJobId,
        text: '',
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }
}
