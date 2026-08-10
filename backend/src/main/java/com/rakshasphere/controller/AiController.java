package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.service.AiEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
public class AiController {

    @Autowired
    private AiEngineService aiEngineService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponseDTO<Map>> getHealth() {
        Map health = aiEngineService.getHealth();
        return ResponseEntity.ok(ApiResponseDTO.ok("AI Engine status retrieved", health));
    }

    @PostMapping("/predict")
    public ResponseEntity<ApiResponseDTO<Map>> predict(@RequestBody Map<String, Object> payload) {
        List<Double> flowFeatures = (List<Double>) payload.get("flowFeatures");
        Integer topK = (Integer) payload.get("topK");

        if (flowFeatures == null) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.error("flowFeatures array is required"));
        }

        Map res = aiEngineService.predict(flowFeatures, topK);
        return ResponseEntity.ok(ApiResponseDTO.ok("Prediction executed", res));
    }

    @PostMapping("/explain")
    public ResponseEntity<ApiResponseDTO<Map>> explain(@RequestBody Map<String, Object> payload) {
        List<Double> flowFeatures = (List<Double>) payload.get("flowFeatures");
        Integer topK = (Integer) payload.get("topK");

        if (flowFeatures == null) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.error("flowFeatures array is required"));
        }

        Map res = aiEngineService.explain(flowFeatures, topK);
        return ResponseEntity.ok(ApiResponseDTO.ok("SHAP attribution dossier generated", res));
    }

    @PostMapping("/batch-predict")
    public ResponseEntity<ApiResponseDTO<Map>> batchPredict(@RequestBody Map<String, Object> payload) {
        List<List<Double>> flows = (List<List<Double>>) payload.get("flows");

        if (flows == null) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.error("flows 2D array is required"));
        }

        Map res = aiEngineService.batchPredict(flows);
        return ResponseEntity.ok(ApiResponseDTO.ok("Batch prediction executed", res));
    }
}
