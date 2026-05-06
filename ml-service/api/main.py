from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import pickle
import re
import os
import numpy as np

app = FastAPI(
    title="Customer Insight ML API",
    description="API for Sentiment Analysis, Topic Modeling, and Business Impact Prediction",
    version="2.0.0"
)

# --- Define Paths ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model", "sentiment")

# Model file paths
MODEL_PATH = os.path.join(MODEL_DIR, "sentiment_lr_model.pkl")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")
LDA_MODEL_PATH = os.path.join(MODEL_DIR, "lda_model.pkl")
COUNT_VECTORIZER_PATH = os.path.join(MODEL_DIR, "count_vectorizer.pkl")
BUSINESS_RF_PATH = os.path.join(MODEL_DIR, "business_rf_model.pkl")

# Topic names from model_info.json
TOPIC_NAMES = [
    "Login & Akses Aplikasi",
    "Transfer & Transaksi",
    "Customer Service",
    "Fitur Mobile Banking",
    "Produk & Bunga"
]

# Business impact label mapping
BUSINESS_IMPACT_LABELS = {
    0: "Low Impact",
    1: "High Impact"
}

# --- Global Variables ---
sentiment_model = None
tfidf_vectorizer = None
label_encoder = None
lda_model = None
count_vectorizer = None
business_rf_model = None


# --- Load All Models on Startup ---
@app.on_event("startup")
def load_models():
    global sentiment_model, tfidf_vectorizer, label_encoder
    global lda_model, count_vectorizer, business_rf_model

    try:
        with open(MODEL_PATH, "rb") as f:
            sentiment_model = pickle.load(f)
        with open(VECTORIZER_PATH, "rb") as f:
            tfidf_vectorizer = pickle.load(f)
        with open(LABEL_ENCODER_PATH, "rb") as f:
            label_encoder = pickle.load(f)
        with open(LDA_MODEL_PATH, "rb") as f:
            lda_model = pickle.load(f)
        with open(COUNT_VECTORIZER_PATH, "rb") as f:
            count_vectorizer = pickle.load(f)
        with open(BUSINESS_RF_PATH, "rb") as f:
            business_rf_model = pickle.load(f)
        print("✅ All models loaded successfully.")
    except Exception as e:
        print(f"❌ Error loading models: {e}")


# --- Text Preprocessing ---
def preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'@\w+|#\w+', '', text)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# --- Inference Functions ---
def run_sentiment(text: str) -> dict:
    cleaned = preprocess_text(text)
    features = tfidf_vectorizer.transform([cleaned])
    probs = sentiment_model.predict_proba(features)[0]
    best_idx = probs.argmax()
    classes = label_encoder.classes_
    return {
        "prediction": str(classes[best_idx]),
        "confidence": float(probs[best_idx]),
        "probabilities": {str(cls): float(prob) for cls, prob in zip(classes, probs)}
    }


def run_topic(text: str) -> dict:
    cleaned = preprocess_text(text)
    count_features = count_vectorizer.transform([cleaned])
    topic_dist = lda_model.transform(count_features)[0]
    top_topic_idx = int(topic_dist.argmax())
    return {
        "dominant_topic": TOPIC_NAMES[top_topic_idx],
        "topic_index": top_topic_idx,
        "topic_distribution": {
            TOPIC_NAMES[i]: float(score)
            for i, score in enumerate(topic_dist)
        }
    }


def run_business_impact(sentiment_result: dict) -> dict:
    probs = sentiment_result["probabilities"]

    # Get values safely - handle both Indonesian and English label keys
    def get_prob(keys):
        for k in keys:
            if k in probs:
                return probs[k]
        return 0.0

    neg = get_prob(["negative", "negatif"])
    pos = get_prob(["positive", "positif"])
    neu = get_prob(["neutral", "netral"])
    sentiment_score = pos - neg

    features = np.array([[neg, pos, sentiment_score, 0.0, 0.0, 0.0, neg]])
    impact_class = int(business_rf_model.predict(features)[0])
    impact_probs = business_rf_model.predict_proba(features)[0]

    return {
        "impact": BUSINESS_IMPACT_LABELS[impact_class],
        "impact_class": impact_class,
        "confidence": float(impact_probs[impact_class]),
        "probabilities": {
            BUSINESS_IMPACT_LABELS[i]: float(p)
            for i, p in enumerate(impact_probs)
        }
    }


# --- Pydantic Schemas ---
class AnalyzeRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    prediction: str
    confidence: float
    probabilities: dict

class AnalyzeAllResponse(BaseModel):
    sentiment: dict
    topic: dict
    business_impact: dict


# --- Endpoints ---
@app.get("/")
def read_root():
    return {
        "message": "Welcome to Customer Insight ML API v2",
        "endpoints": {
            "POST /predict/sentiment": "Sentiment Analysis only",
            "POST /analyze-all": "Full analysis: Sentiment + Topic + Business Impact"
        }
    }


@app.get("/health")
def health_check():
    models_loaded = all([
        sentiment_model, tfidf_vectorizer, label_encoder,
        lda_model, count_vectorizer, business_rf_model
    ])
    return {
        "status": "ok" if models_loaded else "models_not_loaded",
        "models": {
            "sentiment_lr": sentiment_model is not None,
            "tfidf_vectorizer": tfidf_vectorizer is not None,
            "label_encoder": label_encoder is not None,
            "lda_topic": lda_model is not None,
            "count_vectorizer": count_vectorizer is not None,
            "business_rf": business_rf_model is not None,
        }
    }


@app.post("/predict/sentiment", response_model=SentimentResponse)
def predict_sentiment_endpoint(request: AnalyzeRequest):
    if not all([sentiment_model, tfidf_vectorizer, label_encoder]):
        raise HTTPException(status_code=503, detail="Sentiment models not loaded.")
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    try:
        return run_sentiment(request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-all", response_model=AnalyzeAllResponse)
def analyze_all_endpoint(request: AnalyzeRequest):
    if not all([sentiment_model, tfidf_vectorizer, label_encoder, lda_model, count_vectorizer, business_rf_model]):
        raise HTTPException(status_code=503, detail="One or more models are not loaded.")
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    try:
        sentiment = run_sentiment(request.text)
        topic = run_topic(request.text)
        business_impact = run_business_impact(sentiment)
        return {
            "sentiment": sentiment,
            "topic": topic,
            "business_impact": business_impact
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
