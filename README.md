# sonix-speech-recognition

A library for producing audio transcriptions and translations using the Sonix AI service https://sonix.ai/.

## Getting started

1. Create an account on https://sonix.ai/
2. Obtain the auth key from https://my.sonix.ai/api page

## Install

```bash
npm install sonix-speech-recognition
```

## Usage

Transcribe a publicly available file

```ts
import { SonixSpeechRecognitionService } from 'sonix-speech-recognition';

const recognitionService = new SonixSpeechRecognitionService(AUTH_KEY);
const { jobId, text, status, error } = await recognitionService.speechToText({
  audioUrl: audioPublicUrl,
  fileName,
  language: 'en',
});

if (status === 'failed') {
  // handle error
}
```

Transcribe a local file

```ts
import { SonixSpeechRecognitionService } from 'sonix-speech-recognition';

const recognitionService = new SonixSpeechRecognitionService(AUTH_KEY);
const { jobId, text, status, error } = await recognitionService.speechToText({
  audioFilePath,
  fileName,
  language: 'en',
});

if (status === 'failed') {
  // handle error
}
```

Transcribe and translate a local file

```ts
import { SonixSpeechRecognitionService } from 'sonix-speech-recognition';

const recognitionService = new SonixSpeechRecognitionService(AUTH_KEY);
const { jobId, text } = await recognitionService.speechToText({
  audioFilePath,
  fileName,
  language: 'en',
});

const {
  text: translatedText,
  status,
  error,
} = await sonixSpeechKitService.translateTranscription({
  transcriptionJobId: jobId,
  language: 'fr',
});

if (status === 'failed') {
  // handle error
}
```
