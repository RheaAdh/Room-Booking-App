package com.example.profpride.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.profpride.entities.Room;

public interface RoomRepository extends JpaRepository<Room, Long> {

}