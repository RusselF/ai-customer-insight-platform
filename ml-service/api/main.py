from fastapi import FastAPI

app = FastAPI(
    title="Customer Insight ML API",
    description="API for Sentiment Analysis, Topic Modeling, and Prediction",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the ML Service API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
