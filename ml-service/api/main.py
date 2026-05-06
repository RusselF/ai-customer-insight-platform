from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pickle
import re
import os
import numpy as np
from datetime import datetime, timedelta
import random

app = FastAPI(
    title="Customer Insight Platform API",
    description="Aggregate Keyword Analysis for Business Insights",
    version="3.0.0"
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

# --- Mock Dataset Generator ---
# Dataset ini mensimulasikan data mentah yang biasanya didapat dari scraping
MOCK_DATASET = {
    "BCA": [
        "Mbanking bca error mulu dari pagi, mau transfer jadi susah banget #bcaerror",
        "Terima kasih BCA, CS nya ramah banget bantu urus kartu hilang cuma 10 menit.",
        "Kenapa ya aplikasi bca mobile sering keluar sendiri pas mau input pin?",
        "Bunga deposito bca sekarang berapa ya? Mau coba simpan dana di sana.",
        "Suka banget sama UI baru bca mobile, makin clean dan gampang dipake.",
        "Halo @HaloBCA tolong cek DM saya, ada kendala transaksi di ATM tadi siang.",
        "Admin BCA responsif sekali kalau ditanya soal promo kartu kredit.",
        "Akses login bca mobile lemot banget pas jam makan siang, tolong diperbaiki.",
        "BCA emang bank paling aman sih menurutku buat nabung jangka panjang.",
        "Lagi dan lagi m-bca error di saat genting. Kecewa banget sama pelayanannya."
    ] * 10, # Menggandakan agar ada 100 sample
    "GOJEK": [
        "Gojek promo makanannya lagi dikit banget ya sekarang, mahal ongkirnya.",
        "Driver gojek tadi baik banget, dapet air mineral gratis juga pas naik goride.",
        "Aplikasi gojek makin berat aja, sering ngefreeze pas mau pesen gocar.",
        "Gofood nyampe cepet banget, padahal lagi jam sibuk. Keren sistemnya.",
        "Kenapa saldo gopay saya tiba-tiba berkurang padahal gak ada transaksi?",
        "Fitur chat di gojek ngebantu banget buat komunikasi sama driver.",
        "Go-ride harganya makin bersaing sama kompetitor sebelah, mantap.",
        "CS Gojek responsif banget pas ada masalah sama pesanan makanan.",
        "Promo gopay later bikin ketagihan belanja tapi bunganya lumayan ya.",
        "Gojek tolong fiturnya jangan kebanyakan, jadi bingung makenya."
    ] * 10,
    "TOKOPEDIA": [
        "Belanja di tokopedia dapet gratis ongkir terus, hemat banget buat belanja bulanan.",
        "UI Tokopedia paling enak dipake dibanding marketplace lain di Indonesia.",
        "Kenapa pesanan saya dibatalkan otomatis padahal seller bilang barang ready?",
        "Tokopedia card promo cashbacknya lumayan buat beli barang elektronik.",
        "Sering banget nemu barang palsu di tokopedia, tolong filternya diperketat.",
        "Customer service tokopedia lambat banget bales komplain barang rusak.",
        "Fitur topup dan tagihan di tokopedia ngebantu banget buat bayar listrik.",
        "Barang nyampe cepet banget pake pengiriman instant tokopedia.",
        "Banyak promo diskon pas gajian di tokopedia, mantap lah.",
        "Aplikasi tokopedia kadang suka force close sendiri di android."
    ] * 10,
    "SHOPEE": [
        "Shopee video makin seru tapi iklannya jadi makin banyak ya.",
        "Gratis ongkir shopee sekarang syaratnya makin susah dan ribet.",
        "Spaylater emang ngebantu tapi denda keterlambatannya ngeri banget.",
        "Barang dari luar negeri di shopee harganya murah-murah banget.",
        "Live shopee seru, banyak diskon sampe 50 persen kalau belanja di sana.",
        "Shopeefood promonya gila-gilaan, jauh lebih murah dari sebelah.",
        "Kenapa akun shopee saya tiba-tiba kena limit padahal gak ada salah?",
        "Suka banget sama filter pencarian shopee, gampang cari barang termurah.",
        "Game shopee tanam bikin nagih dapet koin buat belanja.",
        "Pengiriman shopee express kadang suka telat sampe seminggu lebih."
    ] * 10,
    "GRAB": [
        "Grabcar hemat bener-bener nolong banget buat dompet mahasiswa.",
        "Promo grabfood melimpah pas weekend, makan enak jadi murah.",
        "Driver grab tadi ugal-ugalan banget bawa motornya, takut bener.",
        "Aplikasi grab simpel dan enteng, gak banyak iklan yang ganggu.",
        "Saldo grabpay saya error gak bisa dipake buat bayar tagihan.",
        "Fitur langganan grab unlimited worth it banget buat yang sering pesen makanan.",
        "CS grab lumayan cepet responnya pas dapet driver yang bermasalah.",
        "Grab express membantu banget kirim dokumen kantor pagi-pagi.",
        "Harga grabbike pas hujan jadi mahal banget dua kali lipat.",
        "Grab tolong dong promonya jangan cuma buat pengguna baru terus."
    ] * 10
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
        print("✅ Models loaded for Keyword Insight Platform.")
    except Exception as e:
        print(f"❌ Error loading models: {e}")


# --- Preprocessing & Core Logic ---
def preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'@\w+|#\w+', '', text)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def analyze_single_text(text: str):
    cleaned = preprocess_text(text)
    
    # Sentiment
    feat_s = tfidf_vectorizer.transform([cleaned])
    probs_s = sentiment_model.predict_proba(feat_s)[0]
    
    # Topic
    feat_t = count_vectorizer.transform([cleaned])
    probs_t = lda_model.transform(feat_t)[0]
    
    return {
        "text": text,
        "sentiment_probs": probs_s,
        "topic_probs": probs_t
    }

# --- Pydantic Schemas ---
class KeywordRequest(BaseModel):
    keyword: str

# --- Endpoints ---

@app.post("/analyze/keyword")
def analyze_keyword(request: KeywordRequest):
    kw = request.keyword.upper()
    if kw not in MOCK_DATASET:
        # Jika keyword tidak ada di mock, kita generate 50 sample random dari bank data umum
        texts = [
            f"Aplikasi {kw} ini lumayan membantu sih buat sehari-hari.",
            f"Kenapa {kw} lemot banget ya hari ini? Padahal sinyal bagus.",
            f"Suka banget sama promo {kw} bulan ini!",
            f"CS {kw} kurang ramah pas dihubungi tadi pagi.",
            f"Update {kw} yang baru bikin hp jadi panas."
        ] * 10
    else:
        texts = MOCK_DATASET[kw]

    results = []
    for t in texts:
        results.append(analyze_single_text(t))

    # 1. Aggregate Sentiment
    all_s_probs = np.mean([r["sentiment_probs"] for r in results], axis=0)
    sentiment_labels = label_encoder.classes_
    sentiment_dist = {str(label_encoder.classes_[i]): float(all_s_probs[i]) for i in range(len(sentiment_labels))}
    
    # Mapping label Indonesian ke English untuk UI (jika perlu)
    map_id_en = {"negatif": "negative", "netral": "neutral", "positif": "positive"}
    final_sentiment = {map_id_en.get(k.lower(), k.lower()): v for k, v in sentiment_dist.items()}

    # 2. Aggregate Topics
    all_t_probs = np.mean([r["topic_probs"] for r in results], axis=0)
    topics_list = []
    for i, score in enumerate(all_t_probs):
        # Cari keywords untuk topik ini (dummy logic based on model)
        topic_keywords = ["fitur", "layanan", "sistem", "error", "update"] if i == 0 else ["transaksi", "biaya", "bayar", "promo", "saldo"]
        
        topics_list.append({
            "name": TOPIC_NAMES[i],
            "keywords": topic_keywords,
            "score": float(score),
            "dominant_sentiment": "positive" if float(all_s_probs[2]) > 0.4 else "negative"
        })
    
    # Urutkan topik berdasarkan score tertinggi
    topics_list = sorted(topics_list, key=lambda x: x["score"], reverse=True)

    # 3. Business Impact Prediction
    # Gunakan aggregate sentiment sebagai input RF
    neg = final_sentiment.get("negative", 0)
    pos = final_sentiment.get("positive", 0)
    sentiment_score = pos - neg
    
    rf_features = np.array([[neg, pos, sentiment_score, -0.05, 0.05, 0.02, neg]])
    impact_class = int(business_rf_model.predict(rf_features)[0])
    impact_prob = float(business_rf_model.predict_proba(rf_features)[0][impact_class])

    # 4. Generate Combined Insight Text
    dominant_topic = topics_list[0]["name"]
    neg_pct = int(neg * 100)
    
    if neg > 0.35:
        insight_text = f"Sentimen negatif cukup tinggi ({neg_pct}%) terutama pada topik '{dominant_topic}'. Perlu segera dilakukan investigasi sistem agar engagement tidak terus menurun."
    elif pos > 0.5:
        insight_text = f"Performa sentimen sangat baik. Topik '{dominant_topic}' menjadi pendorong utama kepuasan customer saat ini. Pertahankan momentum ini!"
    else:
        insight_text = f"Sentimen cenderung stabil namun didominasi oleh percakapan seputar '{dominant_topic}'. Strategi marketing baru mungkin diperlukan untuk meningkatkan daya tarik."

    # 5. Simulated 7-Day Trend
    trend_data = []
    base_date = datetime.now() - timedelta(days=6)
    for i in range(7):
        date_str = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        # Beri sedikit variasi random pada trend
        var = random.uniform(-0.1, 0.1)
        trend_data.append({
            "date": date_str,
            "positive": max(0, min(1, pos + var)),
            "negative": max(0, min(1, neg - var)),
            "neutral": max(0, min(1, 1 - (pos + var) - (neg - var)))
        })

    return {
        "keyword": kw,
        "total_analyzed": len(texts),
        "sentiment": final_sentiment,
        "topics": topics_list[:3], # Top 3 topics
        "prediction": {
            "impact": BUSINESS_IMPACT_LABELS[impact_class],
            "engagement_trend": "up" if sentiment_score > 0 else "down",
            "churn_risk": "high" if neg > 0.4 else ("medium" if neg > 0.2 else "low"),
            "confidence": impact_prob
        },
        "combined_insight": insight_text,
        "trend": trend_data
    }

@app.get("/health")
def health():
    return {"status": "ok", "version": "3.0.0"}
