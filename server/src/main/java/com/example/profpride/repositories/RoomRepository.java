package com.example.profpride.repositories;

import com.example.profpride.models.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    long countByIsAvailableTrue();
}
