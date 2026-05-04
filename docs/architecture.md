# Architecture Overview

## Flow
1. **User input**: Keyword from frontend (Next.js).
2. **Backend API Gateway**: NestJS receives the request, stores user queries/logs to PostgreSQL, and forwards the data request to the ML Service.
3. **ML Service**: Python FastAPI receives the data.
   - Sentiment Analysis
   - Topic Modeling (LDA)
   - Prediction (LSTM / RF)
4. **Results**: Sent back to frontend via NestJS.
5. **Real-time update**: Via Socket.IO (to be implemented).

## Technologies
- Next.js (React)
- NestJS (Node.js)
- FastAPI (Python)
- PostgreSQL
