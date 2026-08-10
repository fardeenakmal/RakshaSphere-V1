package com.rakshasphere.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlowIngestionDTO {

    private String sourceIp;
    private String destinationIp;
    private Integer sourcePort;
    private Integer destinationPort;

    @NotNull(message = "flowFeatures array is required")
    @Size(min = 84, max = 84, message = "flowFeatures must contain exactly 84 numerical values")
    private List<Double> flowFeatures;
}
