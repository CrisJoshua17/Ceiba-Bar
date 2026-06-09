package com.project.micro_realtime.state;

import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;

public class PreparingState implements OrderState {
    @Override
    public void next(Order order) {
        order.setStatus(OrderStatus.EN_CAMINO);
    }

    @Override
    public void cancel(Order order) {
        order.setStatus(OrderStatus.CANCELADO);
    }

    @Override
    public String getStateName() {
        return OrderStatus.PREPARING.name();
    }
}
