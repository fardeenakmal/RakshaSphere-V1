"""
RakshaSphere AI Threat Intelligence Engine — FastAPI Server (:5000)
Exposes sub-10ms REST inference and SHAP explainability endpoints for network flow vectors.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import sys

# Import inference pipeline
sys.path.append(os.path.dirname(__file__))
from inference.pipeline import ThreatInferencePipeline

app = FastAPI(
    title="RakshaSphere AI Inference Engine",
    description="AI-Powered Autonomous Cyber Defense Threat Classifier, Anomaly Detector & SHAP Explainability Engine",
    version="1.1.0"
)

# CORS middleware for Spring Boot and Next.js frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = ThreatInferencePipeline()

class FlowRequest(BaseModel):
    flowFeatures: List[float] = Field(..., description="84-element CICFlowMeter feature float array")
    topK: Optional[int] = Field(5, description="Number of top risk-contributing features to return for explainability")

class BatchFlowRequest(BaseModel):
    flows: List[List[float]]

@app.get("/health")
def health_check():
    """Health check endpoint returning system status and model manifest."""
    return {
        "status": "UP",
        "service": "RakshaSphere AI Inference Engine",
        "modelReady": pipeline.is_ready,
        "manifest": pipeline.manifest
    }

@app.post("/predict")
def predict(request: FlowRequest):
    """Predict threat category, anomaly MSE score, and dynamic risk score for an 84-element flow vector."""
    if len(request.flowFeatures) != 84:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Feature vector length must equal 84, received {len(request.flowFeatures)}"
        )

    try:
        prediction = pipeline.predict_flow(request.flowFeatures)
        return {
            "success": True,
            "message": "Threat classification executed successfully",
            "data": prediction
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline failure: {str(e)}"
        )

@app.post("/explain")
def explain(request: FlowRequest):
    """
    Exposes SHAP (SHapley Additive exPlanations) & Gini feature attribution.
    Returns top_k risk-contributing parameters with percentages and human-readable names.
    """
    if len(request.flowFeatures) != 84:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Feature vector length must equal 84, received {len(request.flowFeatures)}"
        )

    try:
        explanation = pipeline.explain_flow(request.flowFeatures, top_k=request.topK or 5)
        return {
            "success": True,
            "message": "SHAP feature attribution dossier generated successfully",
            "data": explanation
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explainability execution failure: {str(e)}"
        )

@app.post("/batch-predict")
def batch_predict(request: BatchFlowRequest):
    """Execute batch threat inference across multiple flow feature vectors."""
    results = []
    for flow in request.flows:
        if len(flow) == 84:
            results.append(pipeline.predict_flow(flow))

    return {
        "success": True,
        "processedCount": len(results),
        "data": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
