# sonix-speech-recognition

A library for getting audio transcriptions from the Sonix AI service https://sonix.ai/.

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
const { jobId, text } = await recognitionService.speechToText({
  audioUrl: audioPublicUrl,
  fileName,
  language: 'en',
});
```

Transcribe a local file

```ts
import { SonixSpeechRecognitionService } from 'sonix-speech-recognition';

const recognitionService = new SonixSpeechRecognitionService(AUTH_KEY);
const { jobId, text } = await recognitionService.speechToText({
  audioFilePath,
  fileName,
  language: 'en',
});
```
