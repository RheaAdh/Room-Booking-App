package com.example.profpride.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.profpride.models.RoomCost;

@Repository
public interface RoomCostRepository extends JpaRepository<RoomCost, Long> {

}
