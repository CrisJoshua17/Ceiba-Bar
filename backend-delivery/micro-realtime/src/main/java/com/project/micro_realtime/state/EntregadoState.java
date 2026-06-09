package com.project.micro_realtime.state;

import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;

public class EntregadoState implements OrderState {
    @Override
    public void next(Order order) {
        throw new IllegalStateException("La orden ya ha sido entregada a su destino final.");
    }

    @Override
    public void cancel(Order order) {
        throw new IllegalStateException("No se puede cancelar una orden que ya fue entregada.");
    }

    @Override
    public String getStateName() {
        return OrderStatus.ENTREGADO.name();
    }
}
