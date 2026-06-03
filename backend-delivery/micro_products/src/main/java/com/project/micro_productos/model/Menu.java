package com.project.micro_productos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import com.project.micro_productos.model.enums.MenuType;

@Entity
@Table(name = "menus")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Menu extends BaseEntity {

    private String name;
    private String description;
    private boolean active = true;

    @Enumerated(EnumType.STRING)
    private MenuType type;          // DESAYUNO, ALMUERZO, CENA, HAPPY_HOUR, ESPECIAL

    @Column(name = "available_from")
    private LocalTime availableFrom;

    @Column(name = "available_until")
    private LocalTime availableUntil;

    @ElementCollection
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "menu_available_days", joinColumns = @JoinColumn(name = "menu_id"))
    @Column(name = "day_of_week")
    private Set<DayOfWeek> availableDays;

    @OneToMany(mappedBy = "menu", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Product> products = new ArrayList<>();
}
