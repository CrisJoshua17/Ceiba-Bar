package com.project.micro_realtime.state;

import com.project.micro_realtime.model.OrderStatus;

public class OrderStateFactory {
    public static OrderState getState(OrderStatus status) {
        switch (status) {
            case CREATED: return new CreatedState();
            case PREPARING: return new PreparingState();
            case EN_CAMINO: return new EnCaminoState();
            case ENTREGADO: return new EntregadoState();
            case CANCELADO: return new CanceladoState();
            default: throw new IllegalArgumentException("Estado desconocido: " + status);
        }
    }
}
