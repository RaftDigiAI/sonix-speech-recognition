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

```ts
import { SonixSpeechRecognitionService } from 'sonix-speech-recognition';

const recognitionService = new SonixSpeechRecognitionService(AUTH_KEY);
const recognizedText = await recognitionService.speechToText(
  audioPublicUrl,
  fileName,
  'en'
);
```
