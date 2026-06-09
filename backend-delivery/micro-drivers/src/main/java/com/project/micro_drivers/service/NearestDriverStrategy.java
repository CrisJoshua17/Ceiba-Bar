package com.project.micro_drivers.service;

import com.project.micro_drivers.model.Driver;
import org.springframework.stereotype.Component;
import java.util.List;

@Component("nearest")
public class NearestDriverStrategy implements DriverAssignmentStrategy {

    private static final double RESTAURANT_LAT = 19.4326;
    private static final double RESTAURANT_LNG = -99.1332;

    @Override
    public Driver assign(List<Driver> availableDrivers) {
        if (availableDrivers == null || availableDrivers.isEmpty()) {
            return null;
        }

        Driver nearest = null;
        double minDistance = Double.MAX_VALUE;

        for (Driver driver : availableDrivers) {
            if (driver.getCurrentLatitude() == null || driver.getCurrentLongitude() == null) {
                // If a driver doesn't have coordinates, we treat them as fallback but prefer those with coordinates
                continue;
            }
            double dist = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, driver.getCurrentLatitude(), driver.getCurrentLongitude());
            if (dist < minDistance) {
                minDistance = dist;
                nearest = driver;
            }
        }

        // Fallback: if no driver has coordinates, return the first one in the list
        if (nearest == null) {
            nearest = availableDrivers.get(0);
        }

        return nearest;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }
}
