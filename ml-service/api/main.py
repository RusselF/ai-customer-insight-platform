from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import re
import os

app = FastAPI(
    title="Customer Insight ML API",
    description="API for Sentiment Analysis, Topic Modeling, and Prediction",
    version="1.0.0"
)

# --- Define Paths ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model", "sentiment")

MODEL_PATH = os.path.join(MODEL_DIR, "sentiment_lr_model.pkl")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")

# --- Global Variables for Models ---
sentiment_model = None
tfidf_vectorizer = None
label_encoder = None

# --- Load Models on Startup ---
@app.on_event("startup")
def load_models():
    global sentiment_model, tfidf_vectorizer, label_encoder
    try:
        with open(MODEL_PATH, "rb") as f:
            sentiment_model = pickle.load(f)
        with open(VECTORIZER_PATH, "rb") as f:
            tfidf_vectorizer = pickle.load(f)
        with open(LABEL_ENCODER_PATH, "rb") as f:
            label_encoder = pickle.load(f)
        print("Models loaded successfully.")
    except Exception as e:
        print(f"Error loading models: {e}")

# --- Pydantic Schemas ---
class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    prediction: str
    confidence: float
    probabilities: dict

# --- Text Preprocessing Function ---
def preprocess_text(text: str) -> str:
    text = text.lower()                          # 1. Lowercase
    text = re.sub(r'http\S+|www\S+', '', text)   # 2. Hapus URL
    text = re.sub(r'@\w+|#\w+', '', text)        # 3. Hapus mention & hashtag
    text = re.sub(r'[^a-z0-9\s]', ' ', text)     # 4. Hapus karakter spesial
    text = re.sub(r'\s+', ' ', text).strip()     # 5. Hapus spasi berlebih
    return text

# --- Inference Function ---
def predict_sentiment(text: str, model, vectorizer, label_encoder) -> dict:
    # 1. Preprocess
    cleaned_text = preprocess_text(text)
    
    # 2. Vectorize
    features = vectorizer.transform([cleaned_text])
    
    # 3. Predict Probability
    probs = model.predict_proba(features)[0]
    
    # 4. Get the best class
    best_class_idx = probs.argmax()
    best_class_label = label_encoder.inverse_transform([best_class_idx])[0]
    confidence = float(probs[best_class_idx])
    
    # 5. Build probabilities dictionary
    classes = label_encoder.classes_
    probabilities = {str(cls): float(prob) for cls, prob in zip(classes, probs)}
    
    return {
        'prediction': best_class_label,
        'confidence': confidence,
        'probabilities': probabilities
    }

# --- Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the ML Service API"}

@app.get("/health")
def health_check():
    status = "ok" if sentiment_model is not None else "models_not_loaded"
    return {"status": status}

@app.post("/predict/sentiment", response_model=SentimentResponse)
def predict_sentiment_endpoint(request: SentimentRequest):
    if sentiment_model is None or tfidf_vectorizer is None or label_encoder is None:
        raise HTTPException(status_code=503, detail="Models are not loaded yet.")
    
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    try:
        result = predict_sentiment(request.text, sentiment_model, tfidf_vectorizer, label_encoder)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
