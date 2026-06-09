package com.project.micro_realtime.state;

import com.project.micro_realtime.model.Order;

public interface OrderState {
    void next(Order order);
    void cancel(Order order);
    String getStateName();
}
