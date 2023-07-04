import axios from 'axios';
import {
  MAX_WAIT_TIME,
  RECOGNITION_POLLING_DELAY,
  SPEECH_BASE_URL,
} from './constants';
import {
  SupportedLanguage,
  TranscriptionResultResponse,
  TranscriptionStatusResponse,
  UploadAudioResponse,
} from './types';

type ISpeechToTextRequest = {
  audioUrl: string;
  fileName: string;
  language: SupportedLanguage;
};

interface ISonixSpeechRecognitionService {
  speechToText(request: ISpeechToTextRequest): Promise<string>;
}

export class SonixSpeechRecognitionService
  implements ISonixSpeechRecognitionService
{
  constructor(private readonly authKey: string) {}

  private async uploadFileForTranscription(
    audioUrl: string,
    fileName: string,
    language: SupportedLanguage
  ): Promise<UploadAudioResponse> {
    const form = new FormData();

    form.append('file_url', audioUrl);
    form.append('language', language);
    form.append('name', fileName);

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
    transcriptionStatus: TranscriptionStatusResponse,
    language: SupportedLanguage
  ): Promise<TranscriptionResultResponse> {
    const form = new FormData();

    form.append('language', language);

    const response = await axios.get(
      `${SPEECH_BASE_URL}/${transcriptionStatus.id}/transcript`,
      {
        headers: {
          Authorization: `Bearer ${this.authKey}`,
        },
        data: form,
      }
    );

    return response.data as TranscriptionResultResponse;
  }

  async speechToText({
    audioUrl,
    fileName,
    language,
  }: ISpeechToTextRequest): Promise<string> {
    const fileUploadResponse = await this.uploadFileForTranscription(
      audioUrl,
      fileName,
      language
    );

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
    }

    const transcription = await this.getTranscriptionResult(
      transcriptionStatus,
      language
    );

    return transcription;
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
