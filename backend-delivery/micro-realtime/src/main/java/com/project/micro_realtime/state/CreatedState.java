package com.project.micro_realtime.state;

import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;

public class CreatedState implements OrderState {
    @Override
    public void next(Order order) {
        order.setStatus(OrderStatus.PREPARING);
    }

    @Override
    public void cancel(Order order) {
        order.setStatus(OrderStatus.CANCELADO);
    }

    @Override
    public String getStateName() {
        return OrderStatus.CREATED.name();
    }
}
