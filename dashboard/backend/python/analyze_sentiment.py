#!/usr/bin/env python3
"""
Sentiment Analysis Wrapper Script
Processes text data using VADER sentiment analyzer
and outputs structured JSON results.
"""

import sys
import os
import json
from datetime import datetime

# Add senti to path for any custom modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SENTI_PATH = os.path.join(SCRIPT_DIR, '..', '..', '..', 'senti')
sys.path.insert(0, SENTI_PATH)

try:
    import nltk
    from nltk.sentiment import SentimentIntensityAnalyzer
    
    # Download VADER lexicon if not present
    try:
        nltk.data.find('sentiment/vader_lexicon.zip')
    except LookupError:
        nltk.download('vader_lexicon', quiet=True)
    
    SIA = SentimentIntensityAnalyzer()
    VADER_AVAILABLE = True
except ImportError as e:
    VADER_AVAILABLE = False
    IMPORT_ERROR = str(e)

# Crisis keywords for volatility boosting
CRISIS_KEYWORDS = ['fire', 'clash', 'gas', 'trapped', 'riot', 'violence', 
                   'emergency', 'explosion', 'panic', 'stampede', 'attack',
                   'danger', 'threat', 'chaos', 'outbreak']


def analyze_sentiment(text: str) -> dict:
    """
    Analyze sentiment of a single text using VADER.
    Returns sentiment scores and derived metrics.
    """
    if not VADER_AVAILABLE:
        # Fallback to simple heuristics
        return simple_sentiment(text)
    
    scores = SIA.polarity_scores(text)
    compound = scores['compound']
    
    text_lower = text.lower()
    keyword_hit = any(kw in text_lower for kw in CRISIS_KEYWORDS)
    
    # Volatility score based on sentiment + keyword boost
    volatility = abs(compound) * 100
    if keyword_hit:
        volatility += 20
    
    # Risk classification
    if compound <= -0.5 or (keyword_hit and compound < 0):
        risk_level = "High"
    elif compound <= -0.2:
        risk_level = "Medium"
    else:
        risk_level = "Low"
    
    return {
        "positive": round(scores['pos'], 4),
        "negative": round(scores['neg'], 4),
        "neutral": round(scores['neu'], 4),
        "compound": round(compound, 4),
        "volatility": round(volatility, 2),
        "risk_level": risk_level,
        "keyword_flag": keyword_hit
    }


def simple_sentiment(text: str) -> dict:
    """
    Simple fallback sentiment analysis without VADER.
    """
    text_lower = text.lower()
    
    negative_words = ['bad', 'angry', 'hate', 'terrible', 'awful', 'worst', 
                      'danger', 'threat', 'attack', 'violence', 'fear', 'panic']
    positive_words = ['good', 'great', 'love', 'wonderful', 'excellent', 
                      'safe', 'calm', 'peaceful', 'happy', 'joy']
    
    neg_count = sum(1 for word in negative_words if word in text_lower)
    pos_count = sum(1 for word in positive_words if word in text_lower)
    
    total = neg_count + pos_count + 1
    negative = min(neg_count * 0.15, 1.0)
    positive = min(pos_count * 0.15, 1.0)
    neutral = max(0, 1 - positive - negative)
    compound = positive - negative
    
    keyword_hit = any(kw in text_lower for kw in CRISIS_KEYWORDS)
    volatility = abs(compound) * 100
    if keyword_hit:
        volatility += 20
    
    if compound <= -0.5 or (keyword_hit and compound < 0):
        risk_level = "High"
    elif compound <= -0.2:
        risk_level = "Medium"
    else:
        risk_level = "Low"
    
    return {
        "positive": round(positive, 4),
        "negative": round(negative, 4),
        "neutral": round(neutral, 4),
        "compound": round(compound, 4),
        "volatility": round(volatility, 2),
        "risk_level": risk_level,
        "keyword_flag": keyword_hit
    }


def process_texts(texts: list) -> dict:
    """
    Process an array of text items.
    Each item should have: text, and optionally: id, source, timestamp, location
    """
    results = []
    
    for item in texts:
        if isinstance(item, str):
            text = item
            item_data = {"text": text}
        else:
            text = item.get("text", "")
            item_data = item.copy()
        
        if not text:
            continue
        
        sentiment = analyze_sentiment(text)
        
        result = {
            "id": item_data.get("id", str(len(results))),
            "text": text,
            "source": item_data.get("source", "unknown"),
            "timestamp": item_data.get("timestamp", datetime.now().isoformat()),
            "location": item_data.get("location"),
            **sentiment
        }
        
        results.append(result)
    
    # Compute aggregates
    if results:
        compounds = [r["compound"] for r in results]
        volatilities = [r["volatility"] for r in results]
        
        aggregates = {
            "avg_compound": round(sum(compounds) / len(compounds), 4),
            "avg_volatility": round(sum(volatilities) / len(volatilities), 2),
            "high_risk_count": sum(1 for r in results if r["risk_level"] == "High"),
            "medium_risk_count": sum(1 for r in results if r["risk_level"] == "Medium"),
            "low_risk_count": sum(1 for r in results if r["risk_level"] == "Low"),
            "total": len(results)
        }
    else:
        aggregates = {
            "avg_compound": 0,
            "avg_volatility": 0,
            "high_risk_count": 0,
            "medium_risk_count": 0,
            "low_risk_count": 0,
            "total": 0
        }
    
    return {
        "success": True,
        "results": results,
        "aggregates": aggregates,
        "method": "vader" if VADER_AVAILABLE else "simple",
        "analyzed_at": datetime.now().isoformat()
    }


def main():
    # Read JSON input from stdin
    try:
        input_data = json.loads(sys.stdin.read())
    except json.JSONDecodeError as e:
        result = {
            "success": False,
            "error": f"Invalid JSON input: {str(e)}"
        }
        print(json.dumps(result))
        sys.exit(1)
    
    texts = input_data.get("texts", [])
    
    if not texts:
        result = {
            "success": False,
            "error": "No texts provided for analysis"
        }
        print(json.dumps(result))
        sys.exit(1)
    
    result = process_texts(texts)
    print(json.dumps(result))
    
    if not result["success"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
