package com.project.micro_realtime.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignDriverRequest {

    @NotNull(message = "Order ID es requerido")
    private Long orderId;

    @NotNull(message = "Driver ID es requerido")
    private Long driverId;

    private String notes;
}
