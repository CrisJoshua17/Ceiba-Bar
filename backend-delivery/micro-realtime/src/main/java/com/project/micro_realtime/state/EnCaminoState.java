package com.project.micro_realtime.state;

import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;

public class EnCaminoState implements OrderState {
    @Override
    public void next(Order order) {
        order.setStatus(OrderStatus.ENTREGADO);
        order.setDeliveredAt(java.time.LocalDateTime.now());
    }

    @Override
    public void cancel(Order order) {
        throw new IllegalStateException("No se puede cancelar una orden que ya está en camino de entrega.");
    }

    @Override
    public String getStateName() {
        return OrderStatus.EN_CAMINO.name();
    }
}
