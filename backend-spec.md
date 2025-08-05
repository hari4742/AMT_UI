Backend Implementation Details:
implement these endpoints:

1. File Upload & Processing:

```
   @app.post("/api/transcribe")
   async def upload_and_transcribe(
       audio: UploadFile,
       options: TranscriptionOptions = None
   ):
       # 1. Validate audio file
       # 2. Save to temporary storage
       # 3. Start async transcription task
       # 4. Return transcription ID
```

2. Status Polling:

```
   @app.get("/api/transcribe/{transcription_id}/status")
   async def get_status(transcription_id: str):
       # Return current progress and status
```

3. Result Retrieval:

```
   @app.get("/api/transcribe/{transcription_id}/result")
   async def get_result(transcription_id: str):
       # Return MIDI data and metadata
```
