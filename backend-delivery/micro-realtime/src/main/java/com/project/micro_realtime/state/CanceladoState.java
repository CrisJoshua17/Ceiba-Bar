package com.project.micro_realtime.state;

import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;

public class CanceladoState implements OrderState {
    @Override
    public void next(Order order) {
        throw new IllegalStateException("No se puede procesar una orden cancelada.");
    }

    @Override
    public void cancel(Order order) {
        throw new IllegalStateException("La orden ya está cancelada.");
    }

    @Override
    public String getStateName() {
        return OrderStatus.CANCELADO.name();
    }
}
