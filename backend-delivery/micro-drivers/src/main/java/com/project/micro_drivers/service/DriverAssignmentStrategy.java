package com.project.micro_drivers.service;

import com.project.micro_drivers.model.Driver;
import java.util.List;

public interface DriverAssignmentStrategy {
    Driver assign(List<Driver> availableDrivers);
}
