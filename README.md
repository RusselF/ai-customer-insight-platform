# AI-Powered Customer Insight Platform

This project is an AI-powered platform for analyzing customer sentiment, trending topics, and making predictions on business impact.

## Architecture
- **Frontend**: Next.js (React), Tailwind CSS, TypeScript
- **Backend (API Gateway)**: NestJS (Node.js), TypeScript
- **ML Service**: FastAPI (Python)
- **Database**: PostgreSQL

## Directory Structure
- `/frontend`: Next.js frontend application.
- `/backend`: NestJS API Gateway and main backend.
- `/ml-service`: Python FastAPI service for Machine Learning models (Sentiment, Topic Modeling, Prediction).
- `/docs`: Documentation.

## Running the Application
To run the full stack locally via Docker:
```bash
docker-compose up -d
```
